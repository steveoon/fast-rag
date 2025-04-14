import { VisualizationData } from '@/components/visualizations';

// 定义不同类型的消息部分类型，与 AI SDK 对应
export type TextPart = { type: 'text'; text: string };
export type ReasoningPart = { type: 'reasoning'; reasoning: string };
export type ToolInvocationPart = {
  type: 'tool-invocation';
  toolInvocation: {
    toolName: string;
    args?: Record<string, unknown>;
    state?: string;
    result?: unknown;
  };
};
export type SourcePart = {
  type: 'source';
  source: {
    url?: string;
    text?: string;
  };
};
export type FilePart = {
  type: 'file';
  mimeType: string;
  data: string;
};

// 组合所有可能的部分类型
export type MessagePart = TextPart | ReasoningPart | ToolInvocationPart | SourcePart | FilePart;

// 消息内容类型：字符串或消息部分数组
export type MessageContent = string | MessagePart[];

// 基础状态数据接口，包含共享属性
interface BaseStatusData {
  type: string;
  [key: string]: unknown; // 其他未知属性
}

// 文本状态类型
interface TextStatusData extends BaseStatusData {
  type: 'text';
  text: string;
}

// 步骤完成状态类型
interface StepCompleteStatusData extends BaseStatusData {
  type: 'stepComplete';
  stepType: 'initial' | 'tool-result' | 'final';
  hasToolCall: boolean;
  tool?: string[];
  text?: string | null;
}

// 工具状态类型
interface ToolStatusData extends BaseStatusData {
  type: 'toolStatus';
  tool: string;
  status: 'searching' | 'processing' | 'complete' | 'error' | 'noResults' | 'retrieving';
  message: string;
  toolCallId?: string;
  meta?: Record<string, unknown>;
  visualize?: VisualizationData;
}

// 联合类型，表示可能的状态数据类型
export type StatusData = TextStatusData | StepCompleteStatusData | ToolStatusData;

// 组件 Props 类型
export interface ChatBotToolStatusProps {
  // 接受任何类型的数据，因为AI SDK返回的是JSONValue[]
  data: unknown[] | undefined;
  isProcessing: boolean;
}
