/* eslint-disable @typescript-eslint/no-explicit-any */
import { MessageContent as MessageContentComponent } from '@/hooks/message-content';
import Image from 'next/image';
import { MessageContent } from '@/app/chat-bot/[id]/types';
import { ToolCallsGroup } from '@/components/ui/tool-calls-group';
import dynamic from 'next/dynamic';
import { VisualizationData } from '@/components/visualizations';
import { useMemo } from 'react';

// ==========================================
// 1. 类型定义
// ==========================================

// 工具调用结果基础接口
interface ToolInvocationResult {
  [key: string]: any;
  visualize?: VisualizationData;
  imageUrl?: string;
  // 搜索结果通常包含 title 和 url
  title?: string;
  url?: string;
}

// 搜索结果项类型
interface SearchResultItem {
  title: string;
  url: string;
  domain?: string;
}

// AI SDK v6 ToolUIPart 类型（运行时使用）
interface ToolUIPartRuntime {
  type: string; // 格式: 'tool-${toolName}'
  toolCallId: string;
  toolName: string;
  input?: Record<string, unknown>;
  output?: unknown;
  state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
}

// 工具调用组件 Props
interface MessageContentAdapterProps {
  content: MessageContent;
  showCopyButton?: boolean;
  showOnly?: ('reasoning' | 'tool-invocation' | 'tool' | 'source' | 'text')[];
  messageId?: string; // 用于生成稳定的块级 key
}

// 解析后的工具结果（用于统一逻辑）
interface ParsedToolResult {
  hasImage: boolean;
  imageUrl?: string;
  hasVisualization: boolean;
  visualization?: VisualizationData;
  isVisualizationImage: boolean;
  hasSearchResults: boolean;
  searchResults: SearchResultItem[];
  originalResult: ToolInvocationResult;
}

// 工具调用展示分组数据
interface ToolCallForGroup {
  toolName: string;
  toolCallId?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  state: string;
  originalPart: any;
  originalIndex: number;
}

// 直接显示的项（图片或可视化）
interface DirectDisplayItem {
  type: 'image' | 'visualization';
  imageUrl?: string;
  visualization?: VisualizationData;
  toolName: string;
  index: number;
}

// ==========================================
// 2. 工具函数 与 Helper
// ==========================================

// 动态导入可视化渲染器
const VisualizationRenderer = dynamic(
  () => import('@/components/visualizations/VisualizationRenderer'),
  { ssr: false }
);

// 检查 part 是否是工具类型
const isToolPart = (type: string): boolean => {
  return type.startsWith('tool-') || type === 'tool-invocation';
};

// 规范化显示过滤类型
const shouldShowPart = (
  type: string,
  showOnly: ('reasoning' | 'tool-invocation' | 'tool' | 'source' | 'text')[]
): boolean => {
  if (!showOnly || showOnly.length === 0) return true;
  if (type === 'step-start' || type === 'step-finish') return false;
  if (isToolPart(type)) {
    return showOnly.includes('tool') || showOnly.includes('tool-invocation');
  }
  return showOnly.includes(type as any);
};

// 使用代理获取图片URL
export const getProxyImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('aliyuncs.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  if (url.startsWith('http')) {
    return `/api/v1/proxy-image?url=${encodeURIComponent(url)}`;
  }
  return url;
};

/**
 * 统一解析工具输出结果
 * 提取图片、可视化、搜索结果等特定格式
 */
const parseToolResult = (output: unknown): ParsedToolResult => {
  const result = (output || {}) as ToolInvocationResult;

  // 1. 检查可视化数据
  const hasVisualization =
    result &&
    typeof result === 'object' &&
    'visualize' in result &&
    !!result.visualize &&
    typeof result.visualize === 'object' &&
    'type' in result.visualize;

  const isVisualizationImage = hasVisualization && result.visualize!.type === 'image';

  // 2. 检查图片结果 (如果已经是 VisualizationImage，则不视为普通 Image)
  const hasImage =
    result &&
    typeof result === 'object' &&
    'imageUrl' in result &&
    !!result.imageUrl &&
    !isVisualizationImage;

  // 3. 检查搜索结果
  const hasSearchResults =
    result &&
    Array.isArray(result) &&
    result.length > 0 &&
    result[0] &&
    typeof result[0] === 'object' &&
    'title' in result[0] &&
    'url' in result[0];

  return {
    hasImage,
    imageUrl: hasImage ? (result.imageUrl as string) : undefined,
    hasVisualization,
    visualization: hasVisualization ? result.visualize : undefined,
    isVisualizationImage,
    hasSearchResults: !!hasSearchResults,
    searchResults: hasSearchResults ? (result as SearchResultItem[]) : [],
    originalResult: result,
  };
};

// ==========================================
// 3. 子组件 - 渲染内容块
// ==========================================

// 渲染非工具类型的消息部分
const renderPart = (
  part: any,
  index: number,
  showCopyButton: boolean,
  showOnly: ('reasoning' | 'tool-invocation' | 'tool' | 'source' | 'text')[],
  messageId: string
) => {
  const partType = part?.type as string;

  if (!shouldShowPart(partType, showOnly)) {
    return null;
  }

  // 工具部分已在主组件分离，此处不处理
  if (isToolPart(partType)) {
    return null;
  }

  switch (partType) {
    case 'text':
      return (
        <MessageContentComponent
          key={index}
          content={part.text}
          showCopyButton={index === 0 && showCopyButton}
          id={`${messageId}-text-${index}`}
        />
      );
    case 'reasoning':
      return (
        <div
          key={index}
          className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md my-1 border border-blue-100 dark:border-blue-800"
        >
          <div className="font-medium text-blue-700 dark:text-blue-300">🧠 推理过程</div>
          <div className="mt-1 text-gray-700 dark:text-gray-300">
            <MessageContentComponent
              content={part.text || ''}
              showCopyButton={false}
              id={`${messageId}-reasoning-${index}`}
            />
          </div>
        </div>
      );
    case 'source': {
      const source = part.source;
      return (
        <div
          key={index}
          className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded-md my-1 border border-green-100 dark:border-green-800"
        >
          <div className="font-medium text-green-700 dark:text-green-300">
            📚 来源: {source?.url || '未知来源'}
          </div>
          {source?.text && typeof source.text === 'string' && (
            <div className="mt-1 text-gray-700 dark:text-gray-300">
              <MessageContentComponent
                content={source.text}
                showCopyButton={false}
                id={`${messageId}-source-${index}`}
              />
            </div>
          )}
        </div>
      );
    }
    case 'source-url': {
      return (
        <div
          key={index}
          className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded-md my-1 border border-green-100 dark:border-green-800"
        >
          <div className="font-medium text-green-700 dark:text-green-300">
            📚 来源:{' '}
            <a
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {part.title || part.url}
            </a>
          </div>
        </div>
      );
    }
    case 'source-document': {
      return (
        <div
          key={index}
          className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded-md my-1 border border-green-100 dark:border-green-800"
        >
          <div className="font-medium text-green-700 dark:text-green-300">
            📄 文档: {part.title || part.filename || '未知文档'}
          </div>
        </div>
      );
    }
    case 'file': {
      const fileUrl =
        part.url ||
        (part.data ? `data:${part.mediaType || part.mimeType};base64,${part.data}` : '');
      return (
        <div key={index} className="rounded-md overflow-hidden my-2 w-full">
          <Image
            src={fileUrl}
            alt="媒体文件"
            width={0}
            height={0}
            sizes="100vw"
            style={{ objectFit: 'contain' }}
            className="w-full h-auto max-h-[600px] rounded-md"
          />
        </div>
      );
    }
    case 'step-start':
    case 'step-finish':
      return null;
    default:
      return null;
  }
};

// 渲染单个工具调用的详细内容（在 Drawer 中显示）
const renderToolDetailContent = (call: {
  output?: unknown;
  input?: Record<string, unknown>;
  toolName: string;
}) => {
  const parsed = parseToolResult(call.output);

  return (
    <div className="text-xs space-y-2">
      {/* 搜索结果 */}
      {parsed.hasSearchResults && (
        <div className="space-y-1.5">
          <div className="font-medium text-blue-600 dark:text-blue-400">
            🌐 搜索结果 ({parsed.searchResults.length})
          </div>
          <div className="space-y-1 max-h-40 overflow-auto">
            {parsed.searchResults.slice(0, 5).map((item, idx) => (
              <div key={idx} className="bg-gray-100 dark:bg-gray-900 p-1.5 rounded">
                <div className="font-medium truncate">{item.title}</div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 truncate block text-[10px]"
                >
                  {item.url}
                </a>
              </div>
            ))}
            {parsed.searchResults.length > 5 && (
              <div className="text-gray-500 text-center">
                还有 {parsed.searchResults.length - 5} 条结果...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 可视化数据 */}
      {parsed.hasVisualization && (
        <div className="my-2">
          <VisualizationRenderer visualization={parsed.visualization!} />
        </div>
      )}

      {/* 图片结果 */}
      {parsed.hasImage && (
        <div className="my-2 rounded-md overflow-hidden">
          <Image
            src={getProxyImageUrl(parsed.imageUrl!)}
            alt={(parsed.originalResult.prompt as string) || '生成的图像'}
            width={0}
            height={0}
            sizes="100vw"
            style={{ objectFit: 'contain' }}
            className="w-full h-auto max-h-[300px] rounded-md"
          />
        </div>
      )}

      {/* 输入参数 */}
      {call.input && (
        <div>
          <div className="font-medium text-blue-600 dark:text-blue-400 mb-1">参数:</div>
          <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-24 text-[10px]">
            {JSON.stringify(call.input, null, 2)}
          </pre>
        </div>
      )}

      {/* 默认结果展示 (如果是纯文本或JSON，且不是上述特殊类型) */}
      {call.output !== undefined &&
        !parsed.hasImage &&
        !parsed.hasSearchResults &&
        !parsed.hasVisualization && (
          <div>
            <div className="font-medium text-green-600 dark:text-green-400 mb-1">结果:</div>
            <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-24 text-[10px]">
              {typeof call.output === 'string'
                ? call.output
                : JSON.stringify(call.output || {}, null, 2)}
            </pre>
          </div>
        )}
    </div>
  );
};

// ==========================================
// 4. 主组件
// ==========================================

export const MessageContentAdapter = ({
  content,
  showCopyButton = false,
  showOnly = [],
  messageId = 'msg',
}: MessageContentAdapterProps) => {
  // 使用 useMemo 处理内容分组，提升渲染性能
  // 注意：必须在所有 early return 之前调用 hooks 以遵守 React Hooks 规则
  const { toolCalls, otherParts, directDisplayItems } = useMemo(() => {
    // 字符串内容或非数组内容不需要分组处理
    if (typeof content === 'string' || !Array.isArray(content)) {
      return { toolCalls: [], otherParts: [], directDisplayItems: [] };
    }

    const _toolCalls: ToolCallForGroup[] = [];
    const _otherParts: { part: any; index: number }[] = [];
    const _directDisplayItems: DirectDisplayItem[] = [];

    content.forEach((part, index) => {
      const partType = part?.type as string;

      if (!shouldShowPart(partType, showOnly)) {
        return;
      }

      // 处理 AI SDK v6 的 tool-xxx 类型
      if (partType.startsWith('tool-') && partType !== 'tool-invocation') {
        const toolPart = part as ToolUIPartRuntime;

        // 仅处理 output-available 状态的工具调用
        if (toolPart.state === 'output-available') {
          const toolName = toolPart.toolName || partType.replace('tool-', '');
          const parsed = parseToolResult(toolPart.output);

          if (parsed.hasImage) {
            _directDisplayItems.push({
              type: 'image',
              imageUrl: parsed.imageUrl,
              toolName,
              index,
            });
          }
          if (parsed.hasVisualization) {
            _directDisplayItems.push({
              type: 'visualization',
              visualization: parsed.visualization,
              toolName,
              index,
            });
          }

          _toolCalls.push({
            toolName,
            toolCallId: toolPart.toolCallId,
            input: toolPart.input,
            output: toolPart.output,
            state: toolPart.state,
            originalPart: part,
            originalIndex: index,
          });
        }
      }
      // 处理旧版 tool-invocation
      else if (partType === 'tool-invocation') {
        const toolInvocation = part.toolInvocation;
        if (toolInvocation?.state === 'result') {
          const toolName = toolInvocation.toolName || '未命名工具';
          const parsed = parseToolResult(toolInvocation.result);

          if (parsed.hasImage) {
            _directDisplayItems.push({
              type: 'image',
              imageUrl: parsed.imageUrl,
              toolName,
              index,
            });
          }
          if (parsed.hasVisualization) {
            _directDisplayItems.push({
              type: 'visualization',
              visualization: parsed.visualization,
              toolName,
              index,
            });
          }

          _toolCalls.push({
            toolName,
            input: toolInvocation.args,
            output: toolInvocation.result,
            state: 'result',
            originalPart: part,
            originalIndex: index,
          });
        }
      }
      // 其他类型
      else {
        _otherParts.push({ part, index });
      }
    });

    return {
      toolCalls: _toolCalls,
      otherParts: _otherParts,
      directDisplayItems: _directDisplayItems,
    };
  }, [content, showOnly]);

  // 字符串内容直接渲染
  if (typeof content === 'string') {
    return (
      <MessageContentComponent content={content} showCopyButton={showCopyButton} id={messageId} />
    );
  }

  // 如果没有任何可渲染的内容，返回 null
  if (otherParts.length === 0 && toolCalls.length === 0 && directDisplayItems.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 渲染文本、推理等常规部分 */}
      {otherParts.map(({ part, index }) =>
        renderPart(part, index, showCopyButton, showOnly, messageId)
      )}

      {/* 可视化/图片直接展示区 */}
      {directDisplayItems.map((item, idx) => {
        if (item.type === 'image' && item.imageUrl) {
          return (
            <div key={`direct-${item.index}-${idx}`} className="my-2 rounded-md overflow-hidden">
              <Image
                src={getProxyImageUrl(item.imageUrl)}
                alt="生成的图像"
                width={0}
                height={0}
                sizes="100vw"
                style={{ objectFit: 'contain' }}
                className="w-full h-auto max-h-[500px] rounded-md"
              />
            </div>
          );
        }
        if (item.type === 'visualization' && item.visualization) {
          return (
            <div key={`direct-${item.index}-${idx}`} className="my-2">
              <VisualizationRenderer visualization={item.visualization} />
            </div>
          );
        }
        return null;
      })}

      {/* 工具调用折叠区 */}
      {toolCalls.length > 0 && (
        <ToolCallsGroup toolCalls={toolCalls} renderToolDetail={renderToolDetailContent} />
      )}
    </div>
  );
};
