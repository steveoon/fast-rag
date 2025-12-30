import { Output, ToolLoopAgent } from 'ai';
import { z } from 'zod';
import { registry } from '../models-registry';

/**
 * 工厂函数：根据 schema 创建 Exa 搜索结果格式化 Agent
 *
 * @example
 * const { output } = await createSearchFormatterAgent(researchPaperSchema).generate({
 *   prompt: `以下是Exa API的响应: ${JSON.stringify(result)}`,
 * });
 */
export function createSearchFormatterAgent<T extends z.ZodType>(schema: T) {
  return new ToolLoopAgent({
    model: registry.languageModel('google/gemini-3-flash-preview'),
    instructions: `你是一个帮助格式化 Exa 搜索 API 响应的助手。
你的任务是将原始 API 响应转换为标准化的 JSON 格式。
注意：请确保所有字段都正确提取和转换。`,
    output: Output.object({ schema }),
  });
}
