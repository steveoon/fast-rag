import { NextResponse } from 'next/server';
import {
  streamText,
  tool,
  createDataStreamResponse,
  generateObject,
  ToolResult,
  ToolSet,
} from 'ai';
import { z } from 'zod';
import { registry } from '@/lib/utils/models-registry';
import { queryEmbeddings } from '@/lib/actions';
import { handleError, extractApiKey, validateClient } from '@/lib/utils';
import { CustomError } from '@/types';
import { weatherClient, wikipediaClient } from '@/lib/clients';
import { retryRateLimited } from '@/lib/utils/retry';

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
  model: z.string().optional().default('openai:gpt-4o-2024-08-06'),
  enabledTools: z
    .array(z.enum(['knowledgeBase', 'webSearch', 'weather', 'wikipedia']))
    .optional()
    .default(['knowledgeBase']),
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
      execute: async (dataStream) => {
        dataStream.writeData({
          type: 'text',
          text: 'PROCESS START',
        });

        // 初始化工具集
        const allTools: ToolSet = {};

        if (enabledTools.includes('knowledgeBase')) {
          allTools.queryKnowledgeBase = tool({
            description: `从知识库中检索与用户问题相关的信息。当用户询问特定领域知识或需要参考内部文档时使用。`,
            parameters: z.object({
              query: z.string().describe('用户的问题或查询内容'),
            }),
            execute: async ({ query }) => {
              console.log('查询知识库:', query);
              const queryRes = await queryEmbeddings({
                question: query,
                clientId: client.id,
                docs,
                docVersions,
                similarityThreshold,
              });
              return queryRes;
            },
          });
        }

        if (enabledTools.includes('weather')) {
          allTools.getWeather = tool({
            description: '获取特定城市的天气信息，城市名称必须转换为英文',
            parameters: z.object({
              city: z.string().describe('城市名称，必须转换为英文'),
            }),
            execute: async ({ city }) => {
              return await weatherClient.getCurrentWeather(city);
            },
          });
        }

        if (enabledTools.includes('wikipedia')) {
          allTools.wikipediaSearch = tool({
            description: '在维基百科中搜索相关主题',
            parameters: z.object({
              query: z.string().describe('搜索查询'),
            }),
            execute: async ({ query }) => {
              try {
                // 使用通用的重试函数处理429错误
                return await retryRateLimited(() => wikipediaClient.search({ query }));
              } catch (error) {
                console.error('维基百科搜索错误:', error);
                return { error: '搜索失败', message: (error as Error).message };
              }
            },
          });

          allTools.wikipediaGetPageSummary = tool({
            description: '获取特定维基百科页面的摘要',
            parameters: z.object({
              title: z.string().describe('页面标题'),
            }),
            execute: async ({ title }) => {
              try {
                // 使用通用的重试函数处理429错误
                return await retryRateLimited(() => wikipediaClient.getPageSummary({ title }));
              } catch (error) {
                console.error('维基百科摘要获取错误:', error);
                return {
                  error: '获取摘要失败',
                  message: (error as Error).message,
                };
              }
            },
          });
        }

        // 步骤1: 查询分析 - 在streamText之前进行
        const { object: queryAnalysis } = await generateObject({
          model: registry.languageModel(model),
          schema: z.object({
            queryType: z.enum(['factual', 'opinion', 'weather', 'knowledge']),
            requiredTools: z.array(
              z.enum([
                'queryKnowledgeBase',
                'getWeather',
                'wikipediaSearch',
                'wikipediaGetPageSummary',
              ])
            ),
            reasoning: z.string(),
          }),
          prompt: `分析以下用户查询：
          ${messages[messages.length - 1].content}
          
          确定查询类型和需要使用的工具:
          1. queryType (factual, opinion, weather, knowledge)
          2. requiredTools (queryKnowledgeBase, getWeather, wikipediaSearch, wikipediaGetPageSummary)
          3. reasoning (推理过程)
          `,
        });

        console.log('查询分析:', queryAnalysis);

        // 步骤2: 根据分析结果选择工具
        const selectedTools: ToolSet = {};
        queryAnalysis.requiredTools.forEach((toolName) => {
          if (allTools[toolName]) {
            selectedTools[toolName] = allTools[toolName];
          }
        });

        const answer = streamText({
          system: `你是一个智能助手，能够根据用户的问题自主决定使用哪些工具来获取信息。
          
                  可用工具:
                  ${Object.keys(selectedTools)
                    .map((tool) => {
                      if (tool === 'wikipediaSearch') {
                        return `- wikipediaSearch: 用于在维基百科中搜索相关主题`;
                      } else if (tool === 'wikipediaGetPageSummary') {
                        return `- wikipediaGetPageSummary: 用于获取特定维基百科页面的摘要`;
                      } else {
                        return `- ${tool}`;
                      }
                    })
                    .join('\n')}
                  
                  工作流程:
                  1. 分析用户问题，确定需要使用哪些工具
                  2. 调用相应工具获取信息
                  3. 综合所有信息提供最终答案
                  
                  回答要求:
                  - 回答要基于工具调用获取的信息
                  - 如果工具调用没有返回相关信息，请诚实告知用户"抱歉，我无法找到相关信息"
                  - 回答要简洁明了，逻辑清晰
                  - 如果信息来自多个来源，请在回答中注明信息来源`,
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
              tool: toolResult.map((t) => t.tool),
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
