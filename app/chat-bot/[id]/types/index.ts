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
