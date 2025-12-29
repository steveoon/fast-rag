import { VisualizationData } from '@/components/visualizations';

// 定义不同类型的消息部分类型，与 AI SDK v6 对应
// AI SDK v6 TextUIPart
export type TextPart = {
  type: 'text';
  text: string;
  state?: 'streaming' | 'done'; // AI SDK v6 uses 'done' not 'complete'
  providerMetadata?: unknown;
};

// AI SDK v6 ReasoningUIPart - 使用 text 字段
export type ReasoningPart = {
  type: 'reasoning';
  text: string;
  state?: 'streaming' | 'done';
  providerMetadata?: unknown;
};

// AI SDK v6 StepStartUIPart - 用于标记多步骤工具调用的边界
export type StepStartPart = { type: 'step-start' };

// AI SDK v6 ToolUIPart - 工具调用部分
// 注意: AI SDK v6 使用动态类型名如 'tool-webSearch', 'tool-queryKnowledgeBase' 等
// 为了兼容，这里使用 string 类型的 type
export type ToolUIPart = {
  type: string; // 格式: 'tool-${toolName}'
  toolCallId: string;
  toolName: string;
  input?: Record<string, unknown>;
  output?: unknown;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
  providerMetadata?: unknown;
};

// 兼容旧版 tool-invocation 类型（用于过渡）
export type ToolInvocationPart = {
  type: 'tool-invocation';
  toolInvocation: {
    toolName: string;
    args?: Record<string, unknown>;
    state?: string;
    result?: unknown;
  };
};

// AI SDK v6 SourceUrlUIPart
export type SourceUrlPart = {
  type: 'source-url';
  sourceId: string;
  url: string;
  title?: string;
  providerMetadata?: unknown;
};

// AI SDK v6 SourceDocumentUIPart
export type SourceDocumentPart = {
  type: 'source-document';
  sourceId: string;
  mediaType: string;
  title: string;
  filename?: string;
  providerMetadata?: unknown;
};

// 兼容旧版 source 类型
export type SourcePart = {
  type: 'source';
  source: {
    url?: string;
    text?: string;
  };
};

// AI SDK v6 FileUIPart
export type FilePart = {
  type: 'file';
  url: string;
  mediaType: string;
  filename?: string;
  mimeType?: string; // 兼容旧版
  data?: string; // 兼容旧版
};

// 组合所有可能的部分类型
// 注意: ToolUIPart 使用动态 type，需要在运行时检查
export type MessagePart =
  | TextPart
  | ReasoningPart
  | StepStartPart
  | ToolUIPart
  | ToolInvocationPart // 兼容旧版
  | SourcePart
  | SourceUrlPart
  | SourceDocumentPart
  | FilePart;

// 消息内容类型：消息部分数组或 unknown (用于兼容 AI SDK v6)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MessageContent = MessagePart[] | any[];

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
