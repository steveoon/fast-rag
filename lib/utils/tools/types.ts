/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tool, ToolSet, ToolCall, ToolResult, ToolCallUnion, ToolResultUnion } from 'ai';
import { z } from 'zod';
import { ANALYSIS_TOOLS } from './tool-mapping';

// 重新导出这些类型，确保不与tool-mapping.ts中的导出冲突
import type { EnabledToolType, AnalysisToolType } from './tool-mapping';
export type { EnabledToolType, AnalysisToolType };

// 导出AI SDK的类型工具
export type { ToolCall, ToolResult, ToolCallUnion, ToolResultUnion };

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
    'travel', // 旅行相关查询
    'location', // 位置相关查询
    'visualization', // 图像生成相关查询
    'academic', // 学术论文、研究内容查询
    'github', // GitHub仓库、代码和开发者查询
    'webContent', // 网页内容爬取查询
    'social', // 社交媒体内容查询
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

// 为工具调用和结果定义辅助类型
export type AllToolCalls<T extends ToolSet> = ToolCallUnion<T>;
export type AllToolResults<T extends ToolSet> = ToolResultUnion<T>;

// 工具状态类型
export interface ToolStatus {
  type: 'toolStatus';
  tool: string;
  status: 'searching' | 'processing' | 'complete' | 'error' | 'noResults' | 'formatting';
  message: string;
  toolCallId?: string;
  meta?: any; // 工具元数据
  visualize?: {
    type: string; // 可视化类型，如 'map', 'chart', 'image' 等
    data: any; // 可视化所需的数据
  };
}
