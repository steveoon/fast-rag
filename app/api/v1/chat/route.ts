import { NextResponse } from 'next/server';
import { streamText, generateObject, createDataStreamResponse } from 'ai';
import { z } from 'zod';
// import { openrouter } from '@/lib/utils/models-registry';
import { registry } from '@/lib/utils/models-registry';
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
} from '@/lib/utils/tools';

// 定义请求体的验证模式
const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .nonempty('至少需要一条消息'),
  docs: z.array(z.string()).optional(),
  docVersions: z.array(z.string()).optional(),
  similarityThreshold: z.number().min(0).max(1).optional(),
  model: z
    .union([
      z.literal('openai/gpt-4o-2024-11-20'),
      z
        .string()
        .refine(
          val =>
            val.startsWith('openai/') || val.startsWith('anthropic/') || val.startsWith('google/'),
          { message: '模型ID必须以 openai/, anthropic/ 或 google/ 开头' }
        ),
    ])
    .optional()
    .default('anthropic/claude-3-7-sonnet'),
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

    return createDataStreamResponse({
      execute: async dataStream => {
        dataStream.writeData({
          type: 'text',
          text: 'PROCESS START',
        });

        // 创建工具配置
        const toolConfig = {
          clientId: client.id,
          enabledTools,
          docs,
          docVersions,
          similarityThreshold,
          dataStream,
        };

        // 初始化工具集
        const allTools = createTools(toolConfig);

        // 步骤1: 查询分析 - 在streamText之前进行
        const userContent = messages[messages.length - 1].content;
        const { object: queryAnalysis } = await generateObject({
          model: registry.languageModel(modelId),
          schema: queryAnalysisSchema,
          prompt: generateQueryAnalysisPrompt(userContent),
        });

        console.log('查询分析:', queryAnalysis);

        // 步骤2: 选择适合的工具
        const selectedTools = selectTools({
          enabledTools,
          queryAnalysis,
          allTools,
        });

        // 定义工具结果类型 - 使用类型安全助手
        type SelectedToolResults = ToolResultsFrom<typeof selectedTools>;

        // 步骤3: 生成回答
        const answer = streamText({
          system: generateToolSystemPrompt(selectedTools),
          model: registry.languageModel(modelId),
          messages: messages,
          tools: selectedTools,
          toolChoice: 'auto',
          maxSteps,
          onStepFinish: async ({ text, toolResults, usage, stepType }) => {
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

            console.log(`步骤 ${stepType} 完成`, {
              textLength,
              toolResults: processedResults,
              usage,
            });

            dataStream.writeData({
              type: 'stepComplete',
              stepType,
              hasToolCall: processedResults.length > 0,
              tool: processedResults.map(t => t.tool),
              text: text || null,
            });
          },
          onFinish: async ({ toolResults, usage }) => {
            console.log('流程结束', { usage });
            dataStream.writeMessageAnnotation({
              type: 'end',
              metadata: {
                usage,
                toolCalls: toolResults.length,
              },
            });
          },
        });

        answer.mergeIntoDataStream(dataStream, { sendReasoning: true, sendSources: true });
      },
    });
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
