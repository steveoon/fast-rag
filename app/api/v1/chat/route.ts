import { NextResponse } from 'next/server';
import { streamText, tool, createDataStreamResponse } from 'ai';
import { z } from 'zod';
import { registry } from '@/lib/utils/models-registry';
import { queryEmbeddings } from '@/lib/actions';
import { handleError, extractApiKey, validateClient } from '@/lib/utils';
import { CustomError } from '@/types';

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
});

export async function POST(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    const client = await validateClient(apiKey);
    if (!client) {
      throw new CustomError('非法请求', 'UN_AUTH_REQUEST');
    }

    const body = await request.json();
    const { messages, docs, docVersions, similarityThreshold, model } =
      chatRequestSchema.parse(body);

    return createDataStreamResponse({
      execute: async (dataStream) => {
        dataStream.writeData({
          type: 'text',
          text: 'Welcome to the AI chat!',
        });

        const answer = streamText({
          system: `You are a helpful assistant. Check your knowledge base before answering any questions.
                   Only respond to questions using information from tool calls.
                   If no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
          model: registry.languageModel(model),
          messages: messages,
          tools: {
            getInformation: tool({
              description: `Retrieve relevant information from the knowledge base based on the user's input.`,
              parameters: z.object({
                content: z.string().describe("The user's question or input"),
              }),
              execute: async ({ content }) => {
                console.log('content', content);
                const queryRes = await queryEmbeddings({
                  question: content,
                  clientId: client.id,
                  docs,
                  docVersions,
                  similarityThreshold,
                });
                return queryRes;
              },
            }),
          },
          onStepFinish: async ({ text, toolResults, usage }) => {
            const toolResult = toolResults.map((result) => result.result);
            console.log('onStepFinish', { text, toolResult, usage });
          },
          maxSteps: 2,
          onFinish: async () => {
            dataStream.writeMessageAnnotation({
              type: 'end',
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
