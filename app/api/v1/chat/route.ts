import { NextResponse } from 'next/server';
import {
  streamText,
  generateText,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  Output,
} from 'ai';
import type { ModelMessage } from 'ai';
import { z } from 'zod';
import { getLanguageModel } from '@/lib/utils/models-registry';
import {
  handleError,
  extractApiKey,
  validateClient,
  handleObjectGenerationError,
} from '@/lib/utils';
import { validateBotStatus } from '@/lib/utils/validate-bot-status';
import { CustomError } from '@/types';
import {
  ENABLED_TOOLS,
  queryAnalysisSchema,
  createTools,
  selectTools,
  generateToolSystemPrompt,
  generateQueryAnalysisPrompt,
  handleToolResults,
  ToolResultsFrom,
  type QueryAnalysis,
} from '@/lib/utils/tools';
import type { ChatUIMessage, TypedDataStream } from '@/lib/types/ui-message';

// 查询分析函数 - 使用结构化输出
async function analyzeQueryWithFallback(
  modelId: string,
  userContent: string
): Promise<QueryAnalysis> {
  try {
    const { output } = await generateText({
      model: getLanguageModel(modelId),
      output: Output.object({
        schema: queryAnalysisSchema,
      }),
      prompt: generateQueryAnalysisPrompt(userContent),
    });
    return output;
  } catch (error) {
    // 使用统一的错误处理工具
    const result = handleObjectGenerationError(error, {
      schema: queryAnalysisSchema,
      logPrefix: 'QueryAnalysis',
    });

    // 如果成功从原始文本解析出数据，直接返回
    if (result.parsedOutput) {
      return result.parsedOutput;
    }

    // 返回默认分析结果（空的 requiredTools，让 selectTools 根据 enabledTools 自动选择）
    return {
      queryType: 'factual',
      requiredTools: [],
      reasoningText: '无法分析查询，使用默认配置',
    };
  }
}

// 定义消息部分的验证模式（支持 AI SDK v6 的 parts 格式）
const messagePartSchema = z
  .object({
    type: z.string(),
    text: z.string().optional(),
  })
  .passthrough();

// 从消息中提取文本内容的辅助函数
function extractTextFromMessage(message: {
  content?: string | Array<{ type: string; text?: string }>;
  parts?: Array<{ type: string; text?: string }>;
}): string {
  // 1. 如果 content 是字符串，直接返回
  if (typeof message.content === 'string') {
    return message.content;
  }

  // 2. 如果 content 是数组，从中提取文本
  if (Array.isArray(message.content)) {
    const textPart = message.content.find(p => p.type === 'text' && p.text);
    if (textPart?.text) return textPart.text;
  }

  // 3. 如果有 parts 数组，从中提取文本
  if (Array.isArray(message.parts)) {
    const textPart = message.parts.find(p => p.type === 'text' && p.text);
    if (textPart?.text) return textPart.text;
  }

  return '';
}

// 将验证后的消息转换为 ModelMessage 格式
function transformToModelMessages(
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content?: string | Array<{ type: string; text?: string }>;
    parts?: Array<{ type: string; text?: string }>;
  }>
): ModelMessage[] {
  return messages.map(msg => {
    const textContent = extractTextFromMessage(msg);
    return {
      role: msg.role,
      content: textContent,
    } as ModelMessage;
  });
}

// 定义请求体的验证模式（兼容 content 字符串和 parts 数组两种格式）
const chatRequestSchema = z.object({
  botId: z.string().uuid().optional(), // 可选的 Bot ID，用于验证 Bot 状态
  messages: z
    .array(
      z
        .object({
          role: z.enum(['user', 'assistant', 'system']),
          // 支持两种格式：string content 或 parts 数组
          content: z.union([z.string(), z.array(messagePartSchema)]).optional(),
          parts: z.array(messagePartSchema).optional(),
        })
        .passthrough()
    )
    .nonempty('至少需要一条消息'),
  docs: z.array(z.string()).optional(),
  docVersions: z.array(z.string()).optional(),
  similarityThreshold: z.number().min(0).max(1).optional(),
  model: z
    .string()
    .refine(
      val => {
        const validPrefixes = [
          'openai/',
          'anthropic/',
          'google/',
          'qwen/',
          'openrouter/',
          'ohmygpt/',
          'moonshotai/',
          'deepseek/',
        ];
        return validPrefixes.some(prefix => val.startsWith(prefix));
      },
      { message: '模型ID格式不正确，必须以有效的 provider 前缀开头' }
    )
    .optional()
    .default('anthropic/claude-haiku-4-5'),
  enabledTools: z
    .array(z.enum(ENABLED_TOOLS))
    .optional()
    .default(['knowledgeBase', 'smartWikidata']),
  maxSteps: z.number().optional().default(5),
});

/**
 * @swagger
 * /api/v1/chat:
 *   post:
 *     summary: 聊天接口
 *     description: 与AI助手进行对话，支持知识库检索和多种工具
 *     tags:
 *       - 对话
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *     responses:
 *       200:
 *         description: 成功返回一个流式响应
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   description: 响应类型
 *                 text:
 *                   type: string
 *                   description: 返回内容
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未授权访问
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器内部错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *     security:
 *       - BearerAuth: []
 */
export async function POST(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    const client = await validateClient(apiKey);
    if (!client) {
      throw new CustomError('非法请求', 'UN_AUTH_REQUEST');
    }

    const body = await request.json();
    const {
      botId,
      messages,
      docs,
      docVersions,
      similarityThreshold,
      model,
      enabledTools,
      maxSteps,
    } = chatRequestSchema.parse(body);

    // Bot 状态验证（如果提供了 botId）
    if (botId) {
      const botValidation = await validateBotStatus(botId);

      if (botValidation.error === 'BOT_NOT_FOUND') {
        throw new CustomError('聊天机器人不存在', 'BOT_NOT_FOUND');
      }

      if (!botValidation.isValid) {
        throw new CustomError('该聊天机器人当前未启用', 'BOT_DISABLED');
      }

      // 验证 Bot 属于当前 Client
      if (botValidation.clientId !== client.id) {
        throw new CustomError('无权访问此聊天机器人', 'UNAUTHORIZED_BOT_ACCESS');
      }
    }

    // 确保model是正确的格式字符串
    const modelId = model as `anthropic/${string}` | `openai/${string}` | `google/${string}`;

    const stream = createUIMessageStream<ChatUIMessage>({
      execute: async ({ writer }) => {
        // 创建类型安全的数据流适配器
        const typedDataStream: TypedDataStream = {
          // 发送工具状态更新
          writeToolStatus: (data, options) => {
            writer.write({
              type: 'data-toolStatus',
              id: options?.id,
              data,
              transient: options?.transient,
            });
          },
          // 发送处理状态通知 (临时)
          writeProcessingStatus: data => {
            writer.write({
              type: 'data-processingStatus',
              data,
              transient: true,
            });
          },
          // 发送通用通知 (临时)
          writeNotification: data => {
            writer.write({
              type: 'data-notification',
              data,
              transient: true,
            });
          },
          // 发送知识库检索结果
          writeKnowledgeBase: (data, options) => {
            writer.write({
              type: 'data-knowledgeBase',
              id: options?.id,
              data,
            });
          },
          // 发送来源引用
          writeSource: source => {
            if (source.type === 'url' && source.url) {
              writer.write({
                type: 'source-url',
                sourceId: source.id,
                url: source.url,
                title: source.title,
              });
            } else if (source.type === 'document') {
              writer.write({
                type: 'source-document',
                sourceId: source.id,
                mediaType: 'text/plain',
                title: source.title || source.filename || 'Document',
                filename: source.filename,
              });
            }
          },
          // 保留向后兼容的通用方法
          writeData: (value: unknown) => {
            const data = value as { type?: string; [key: string]: unknown };
            const dataType = data.type || 'unknown';
            writer.write({
              type: `data-${dataType}` as `data-${string}`,
              data: value,
            });
          },
          writeMessageAnnotation: (value: unknown) => {
            writer.write({
              type: 'data-annotation' as `data-${string}`,
              data: value,
            });
          },
        };

        // 发送开始处理通知 (临时)
        typedDataStream.writeProcessingStatus({
          status: 'started',
          message: '正在处理您的请求...',
        });

        // 创建工具配置
        const toolConfig = {
          clientId: client.id,
          enabledTools,
          docs,
          docVersions,
          similarityThreshold,
          dataStream: typedDataStream,
        };

        // 初始化工具集
        const allTools = createTools(toolConfig);

        // 步骤1: 查询分析 - 在streamText之前进行（带降级方案）
        const lastMessage = messages[messages.length - 1];
        const userContent = extractTextFromMessage(lastMessage);

        // 发送分析中状态 (临时)
        typedDataStream.writeProcessingStatus({
          status: 'analyzing',
          message: '正在分析查询意图...',
        });

        const queryAnalysis = await analyzeQueryWithFallback(modelId, userContent);

        console.log('查询分析:', queryAnalysis);

        // 步骤2: 选择适合的工具
        const selectedTools = selectTools({
          enabledTools,
          queryAnalysis,
          allTools,
        });

        // 定义工具结果类型 - 使用类型安全助手
        type SelectedToolResults = ToolResultsFrom<typeof selectedTools>;

        // 步骤3: 转换消息格式并生成回答
        const modelMessages = transformToModelMessages(messages);

        // 根据查询分析结果，发送预期的处理状态
        if (queryAnalysis.requiredTools && queryAnalysis.requiredTools.length > 0) {
          // 如果分析结果表明需要使用工具
          typedDataStream.writeProcessingStatus({
            status: 'toolCalling',
            message: `正在准备使用工具...`,
          });
        } else {
          // 直接生成回答
          typedDataStream.writeProcessingStatus({
            status: 'generating',
            message: '正在生成回答...',
          });
        }

        // 跟踪当前步骤和状态
        let currentStep = 0;
        let hasStartedGenerating = false;
        let hadToolCall = false;

        const answer = streamText({
          system: generateToolSystemPrompt(selectedTools),
          model: getLanguageModel(modelId),
          messages: modelMessages,
          tools: selectedTools,
          toolChoice: 'auto',
          maxOutputTokens: 8192, // 限制输出 token 数量，避免超出 API 额度
          stopWhen: stepCountIs(maxSteps),

          // 检测文本生成开始
          onChunk: ({ chunk }) => {
            // 当收到第一个文本 chunk 时，发送 generating 状态
            if (chunk.type === 'text-delta' && !hasStartedGenerating) {
              hasStartedGenerating = true;
              // 如果之前有工具调用，现在开始生成基于工具结果的回答
              if (hadToolCall) {
                typedDataStream.writeProcessingStatus({
                  status: 'generating',
                  message: '正在根据工具结果生成回答...',
                });
              }
            }
            // 检测工具调用开始
            if (chunk.type === 'tool-call' && !hadToolCall) {
              hadToolCall = true;
              typedDataStream.writeProcessingStatus({
                status: 'toolCalling',
                message: `正在调用工具: ${chunk.toolName}...`,
              });
            }
          },

          onStepFinish: async ({ text, toolCalls, toolResults, usage }) => {
            currentStep++;

            // 使用类型安全的工具结果处理
            const processedResults: Array<{ tool: string; result: unknown }> = [];

            // 处理工具结果
            await handleToolResults(
              selectedTools,
              toolResults as Array<SelectedToolResults>,
              async (toolName, result) => {
                processedResults.push({
                  tool: toolName,
                  result,
                });
              }
            );

            const hasToolCall = processedResults.length > 0 || (toolCalls && toolCalls.length > 0);
            const textLength = text.length;

            console.log(`步骤 ${currentStep} 完成`, {
              textLength,
              hasToolCall,
              toolCalls: toolCalls?.map(tc => tc.toolName),
              toolResults: processedResults,
              usage,
            });

            // 工具调用步骤完成时更新状态
            if (hasToolCall && processedResults.length > 0) {
              const toolNames = processedResults.map(t => t.tool);
              // 显示工具已完成但流程仍在继续，避免用户误以为结束
              typedDataStream.writeProcessingStatus({
                status: 'toolCalling',
                message: `${toolNames.join(', ')} 已完成，继续处理中...`,
              });
            }
            // 注意：generating 状态由 onChunk 的 text-delta 检测触发

            // 发送步骤完成数据 (持久)
            writer.write({
              type: 'data-stepComplete',
              data: {
                hasToolCall,
                tool: processedResults.map(t => t.tool),
                text: text || null,
              },
            });
          },

          onFinish: async ({ toolResults, usage }) => {
            console.log('流程结束', { usage });
            // 发送完成通知 (临时)
            typedDataStream.writeProcessingStatus({
              status: 'completed',
              message: '处理完成',
            });
            // 发送元数据注解
            typedDataStream.writeMessageAnnotation({
              type: 'end',
              metadata: {
                usage,
                toolCalls: toolResults.length,
              },
            });
          },
        });

        // 将 streamText 结果合并到 UI 消息流
        writer.merge(answer.toUIMessageStream({ sendReasoning: true, sendSources: true }));
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    const { message, code, details } = handleError(error);
    const status =
      code === 'UNEXPECTED_ERROR' || code === 'UNKNOWN_ERROR'
        ? 500
        : code === 'VALIDATION_ERROR'
          ? 400
          : 400;
    return NextResponse.json({ error: message, details, code }, { status });
  }
}
