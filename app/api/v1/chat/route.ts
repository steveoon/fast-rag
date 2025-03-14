import { NextResponse } from 'next/server';
import { streamText, generateObject, ToolResult, createDataStreamResponse } from 'ai';
import { z } from 'zod';
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
  model: z.string().optional().default('openai:gpt-4o-2024-11-20'),
  enabledTools: z
    .array(z.enum(ENABLED_TOOLS))
    .optional()
    .default(['knowledgeBase', 'smartWikidata']),
  maxSteps: z.number().optional().default(5),
});

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
          model: registry.languageModel(model),
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

        // 步骤3: 生成回答
        const answer = streamText({
          system: generateToolSystemPrompt(selectedTools),
          model: registry.languageModel(model),
          messages: messages,
          tools: selectedTools,
          toolChoice: 'auto',
          maxSteps,
          onStepFinish: async ({ text, toolResults, usage, stepType }) => {
            const toolResult = toolResults.map((result: ToolResult<string, unknown, unknown>) => ({
              tool: result.toolName,
              result: JSON.stringify(result.result),
            }));

            console.log(`步骤 ${stepType} 完成`, { text, toolResult, usage });

            dataStream.writeData({
              type: 'stepComplete',
              stepType,
              hasToolCall: toolResult.length > 0,
              tool: toolResult.map(t => t.tool),
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

        answer.mergeIntoDataStream(dataStream);
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
