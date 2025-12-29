import { NextResponse } from 'next/server';
import {
  streamText,
  generateObject,
  generateText,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
} from 'ai';
import type { ModelMessage } from 'ai';
import { z } from 'zod';
import { getLanguageModel } from '@/lib/utils/models-registry';
import { handleError, extractApiKey, validateClient } from '@/lib/utils';
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

// 从 markdown 代码块中提取 JSON 的辅助函数
function extractJsonFromText(text: string): string {
  // 尝试匹配 ```json ... ``` 或 ``` ... ``` 代码块
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  // 如果没有代码块，返回原始文本
  return text.trim();
}

// 带降级方案的查询分析函数
async function analyzeQueryWithFallback(
  modelId: string,
  userContent: string
): Promise<QueryAnalysis> {
  try {
    // 首先尝试使用 generateObject
    const { object } = await generateObject({
      model: getLanguageModel(modelId),
      schema: queryAnalysisSchema,
      prompt: generateQueryAnalysisPrompt(userContent),
    });
    return object;
  } catch (error) {
    console.warn('generateObject 失败，尝试使用 generateText 降级方案:', error);

    try {
      // 降级方案：使用 generateText 然后手动解析
      const { text } = await generateText({
        model: getLanguageModel(modelId),
        prompt: generateQueryAnalysisPrompt(userContent),
      });

      const jsonStr = extractJsonFromText(text);
      const parsed = JSON.parse(jsonStr);

      // 验证解析结果符合 schema
      return queryAnalysisSchema.parse(parsed);
    } catch (fallbackError) {
      console.warn('降级方案也失败，使用默认分析结果:', fallbackError);

      // 最终降级：返回默认分析结果
      return {
        queryType: 'factual',
        requiredTools: ['queryKnowledgeBase'],
        reasoningText: '无法分析查询，使用默认工具配置',
      };
    }
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
    const { messages, docs, docVersions, similarityThreshold, model, enabledTools, maxSteps } =
      chatRequestSchema.parse(body);

    // 确保model是正确的格式字符串
    const modelId = model as `anthropic/${string}` | `openai/${string}` | `google/${string}`;

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // 创建适配器，将 writer 接口适配为 DataStream 接口
        const dataStreamAdapter = {
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
          // 向后兼容的 write 方法，用于工具定义中的旧代码
          write: (data: { type: string; value: unknown[] }) => {
            if (data.type === 'data' && Array.isArray(data.value)) {
              for (const item of data.value) {
                const itemData = item as { type?: string; [key: string]: unknown };
                const dataType = itemData.type || 'unknown';
                writer.write({
                  type: `data-${dataType}` as `data-${string}`,
                  data: item,
                });
              }
            }
          },
        };

        // 创建工具配置
        const toolConfig = {
          clientId: client.id,
          enabledTools,
          docs,
          docVersions,
          similarityThreshold,
          dataStream: dataStreamAdapter,
        };

        // 初始化工具集
        const allTools = createTools(toolConfig);

        // 步骤1: 查询分析 - 在streamText之前进行（带降级方案）
        const lastMessage = messages[messages.length - 1];
        const userContent = extractTextFromMessage(lastMessage);
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
        const answer = streamText({
          system: generateToolSystemPrompt(selectedTools),
          model: getLanguageModel(modelId),
          messages: modelMessages,
          tools: selectedTools,
          toolChoice: 'auto',
          maxOutputTokens: 8192, // 限制输出 token 数量，避免超出 API 额度
          stopWhen: stepCountIs(maxSteps),

          onStepFinish: async ({ text, toolResults, usage }) => {
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

            const textLength = text.length;

            console.log(`步骤完成`, {
              textLength,
              toolResults: processedResults,
              usage,
            });

            dataStreamAdapter.writeData({
              type: 'stepComplete',
              hasToolCall: processedResults.length > 0,
              tool: processedResults.map(t => t.tool),
              text: text || null,
            });
          },

          onFinish: async ({ toolResults, usage }) => {
            console.log('流程结束', { usage });
            dataStreamAdapter.writeMessageAnnotation({
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
