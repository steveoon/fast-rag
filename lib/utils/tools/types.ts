/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool, ToolSet } from 'ai';
import { z } from 'zod';
import { ANALYSIS_TOOLS } from './tool-mapping';

// 重新导出这些类型，确保不与tool-mapping.ts中的导出冲突
import type { EnabledToolType, AnalysisToolType } from './tool-mapping';
export type { EnabledToolType, AnalysisToolType };

// JSON值类型
type JSONValue = string | number | boolean | null | { [key: string]: JSONValue } | JSONValue[];

// 定义数据流的类型
export interface DataStream {
  writeData: (value: JSONValue) => void;
  writeMessageAnnotation: (value: JSONValue) => void;
}

// 查询分析Schema
export const queryAnalysisSchema = z.object({
  queryType: z.enum([
    'factual', // 事实性查询
    'opinion', // 观点类查询
    'weather', // 天气查询
    'knowledge', // 知识库查询
    'current', // 当前事件/最新信息
    'technical', // 技术类问题
    'comparison', // 比较分析
    'historical', // 历史信息
  ]),
  requiredTools: z.array(z.enum(ANALYSIS_TOOLS)),
  reasoning: z.string(),
});

// 查询分析结果类型
export type QueryAnalysis = z.infer<typeof queryAnalysisSchema>;

// 工具函数的配置接口
export interface ToolConfig {
  clientId: string;
  enabledTools: EnabledToolType[];
  docs?: string[];
  docVersions?: string[];
  similarityThreshold?: number;
  dataStream?: DataStream; // 流式响应的数据流
}

// 工具创建器接口
export interface ToolDefinition {
  toolName: AnalysisToolType;
  // 创建工具的函数，返回工具实现
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  createTool: (config: ToolConfig) => Tool<any, any>;
  // 检查工具是否可用
  isEnabled: (enabledTools: EnabledToolType[]) => boolean;
}

// 工具选择器配置
export interface ToolSelectorConfig {
  enabledTools: EnabledToolType[];
  queryAnalysis: QueryAnalysis;
  allTools: ToolSet;
}
