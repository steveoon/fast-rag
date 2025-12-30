import { Output, ToolLoopAgent } from 'ai';
import { z } from 'zod';
import { registry } from '../models-registry';

/**
 * 工厂函数：根据 schema 创建 Google Maps 数据格式化 Agent
 *
 * @example
 * const { output } = await createMapsFormatterAgent(placesSchema).generate({
 *   prompt: `请格式化: ${JSON.stringify(result)}`,
 * });
 */
export function createMapsFormatterAgent<T extends z.ZodType>(schema: T) {
  return new ToolLoopAgent({
    model: registry.languageModel('google/gemini-3-flash-preview'),
    instructions: `你是一个帮助格式化 Google Maps API 响应的助手。
你的任务是将原始 API 响应转换为标准化的 JSON 格式。
注意：请确保所有字段都正确转换，特别是坐标要使用数值类型。`,
    output: Output.object({ schema }),
  });
}
