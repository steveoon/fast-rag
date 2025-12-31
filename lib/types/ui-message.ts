import type { UIMessage } from 'ai';
import type { VisualizationData } from '@/components/visualizations';

/**
 * 自定义数据部分类型定义
 * 用于 AI SDK v6 的类型安全流式数据
 *
 * 后端使用: createUIMessageStream<ChatUIMessage>({ ... })
 * 前端使用: useChat<ChatUIMessage>({ onData: ... })
 *
 * 数据部分分为两类:
 * 1. 持久数据 (persistent) - 保存到 message.parts，用于渲染历史记录
 * 2. 临时数据 (transient) - 仅通过 onData 获取，用于实时状态显示
 */

// ============================================
// 持久数据部分 (保存到 message.parts)
// ============================================

// 工具状态数据 - 显示工具执行结果
export interface ToolStatusDataPart {
  tool: string;
  status: 'searching' | 'processing' | 'retrieving' | 'complete' | 'error' | 'noResults';
  message: string;
  toolCallId?: string;
  meta?: Record<string, unknown>;
  visualize?: VisualizationData;
}

// 步骤完成数据 - 标记步骤边界和工具调用情况
export interface StepCompleteDataPart {
  hasToolCall: boolean;
  tool?: string[];
  text?: string | null;
}

// 知识库检索结果数据 - RAG 场景
export interface KnowledgeBaseDataPart {
  query: string;
  results: Array<{
    content: string;
    similarity: number;
    documentTitle?: string;
  }>;
  status: 'loading' | 'success' | 'empty';
}

// ============================================
// 临时数据部分 (仅通过 onData 获取)
// ============================================

// 处理状态通知 - 显示当前处理阶段
export interface ProcessingStatusDataPart {
  status: 'started' | 'analyzing' | 'toolCalling' | 'generating' | 'completed';
  message: string;
  progress?: number; // 0-100
}

// 通用通知 - 显示临时消息
export interface NotificationDataPart {
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
}

// ============================================
// 数据部分映射 (用于 UIMessage 泛型)
// ============================================

// 数据部分映射类型 - 需要索引签名以满足 UIDataTypes 约束
export type ChatDataParts = {
  // 持久数据
  toolStatus: ToolStatusDataPart;
  stepComplete: StepCompleteDataPart;
  knowledgeBase: KnowledgeBaseDataPart;
  // 临时数据 (仅 onData 可用)
  processingStatus: ProcessingStatusDataPart;
  notification: NotificationDataPart;
  // 索引签名 - 满足 Record<string, unknown> 约束
  [key: string]: unknown;
};

// 消息元数据类型
export interface ChatMessageMetadata {
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolCalls?: number;
  processingTime?: number;
}

// ============================================
// 自定义 UIMessage 类型
// ============================================

/**
 * 类型安全的 UIMessage
 * 用于 createUIMessageStream 和 useChat 泛型
 */
export type ChatUIMessage = UIMessage<ChatMessageMetadata, ChatDataParts>;

// ============================================
// Writer 类型 (用于后端工具定义)
// ============================================

/**
 * UIMessageStream Writer 接口
 * 用于在工具执行过程中发送实时数据
 */
export interface ChatUIMessageWriter {
  /**
   * 发送工具状态更新
   * @param id - 可选 ID，相同 ID 的数据会进行协调更新
   * @param data - 工具状态数据
   * @param transient - 是否为临时数据，默认 false
   */
  writeToolStatus: (
    data: ToolStatusDataPart,
    options?: { id?: string; transient?: boolean }
  ) => void;

  /**
   * 发送处理状态通知 (临时)
   */
  writeProcessingStatus: (data: ProcessingStatusDataPart) => void;

  /**
   * 发送通用通知 (临时)
   */
  writeNotification: (data: NotificationDataPart) => void;

  /**
   * 发送知识库检索结果
   */
  writeKnowledgeBase: (data: KnowledgeBaseDataPart, options?: { id?: string }) => void;

  /**
   * 发送来源引用
   */
  writeSource: (source: {
    type: 'url' | 'document';
    id: string;
    url?: string;
    title?: string;
    filename?: string;
  }) => void;
}

// ============================================
// 工具配置接口更新
// ============================================

/**
 * 更新的 DataStream 接口
 * 提供类型安全的数据写入方法
 */
export interface TypedDataStream extends ChatUIMessageWriter {
  // 保留向后兼容的通用方法
  writeData: (value: unknown) => void;
  writeMessageAnnotation: (value: unknown) => void;
}
