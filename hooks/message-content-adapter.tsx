/* eslint-disable @typescript-eslint/no-explicit-any */
import { MessageContent as MessageContentComponent } from '@/hooks/message-content';
import Image from 'next/image';
import { MessageContent } from '@/app/chat-bot/[id]/types';
import { CollapsibleDrawer } from '@/components/ui/collapsible-drawer';
import { ToolCallsGroup } from '@/components/ui/tool-calls-group';
import dynamic from 'next/dynamic';
import { VisualizationData } from '@/components/visualizations';

// 工具调用结果类型
interface ToolInvocationResult {
  [key: string]: any;
  visualize?: VisualizationData;
  imageUrl?: string;
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

// 动态导入可视化渲染器，避免SSR问题
const VisualizationRenderer = dynamic(
  () => import('@/components/visualizations/VisualizationRenderer'),
  { ssr: false }
);

// 检查 part 是否是工具类型 (AI SDK v6 使用 'tool-${toolName}' 格式)
const isToolPart = (type: string): boolean => {
  return type.startsWith('tool-') || type === 'tool-invocation';
};

// 规范化显示过滤类型，用于匹配 showOnly
const shouldShowPart = (
  type: string,
  showOnly: ('reasoning' | 'tool-invocation' | 'tool' | 'source' | 'text')[]
): boolean => {
  // 如果没有设置 showOnly，显示所有内容
  if (!showOnly || showOnly.length === 0) return true;

  // step-start 和 step-finish 总是不显示
  if (type === 'step-start' || type === 'step-finish') return false;

  // 工具类型特殊处理 (tool-xxx 或 tool-invocation)
  if (isToolPart(type)) {
    return showOnly.includes('tool') || showOnly.includes('tool-invocation');
  }

  // 其他类型直接匹配
  return showOnly.includes(type as any);
};

// 使用代理获取图片URL
export const getProxyImageUrl = (url: string): string => {
  if (!url) return '';

  // 检测是否为阿里云OSS图片链接
  if (url.includes('aliyuncs.com')) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }

  // 如果是绝对URL，使用我们自己的代理
  if (url.startsWith('http')) {
    return `/api/v1/proxy-image?url=${encodeURIComponent(url)}`;
  }

  return url;
};

interface MessageContentAdapterProps {
  content: MessageContent;
  showCopyButton?: boolean;
  showOnly?: ('reasoning' | 'tool-invocation' | 'tool' | 'source' | 'text')[];
  messageId?: string; // 用于生成稳定的块级 key，优化流式渲染性能
}

// 渲染 AI SDK v6 工具调用部分
const renderToolUIPart = (part: ToolUIPartRuntime, index: number) => {
  // 只显示 output-available 状态的工具调用
  if (part.state !== 'output-available') {
    return null;
  }

  const result = (part.output || {}) as ToolInvocationResult;
  const toolName = part.toolName || part.type.replace('tool-', '');

  // 检查是否有图片结果
  const hasImageResult =
    result && typeof result === 'object' && 'imageUrl' in result && result.imageUrl;

  // 检查是否有搜索结果
  const hasSearchResults =
    result &&
    Array.isArray(result) &&
    result.length > 0 &&
    result[0] &&
    typeof result[0] === 'object' &&
    'title' in result[0] &&
    'url' in result[0];

  // 检查是否有可视化数据
  const hasVisualization =
    result &&
    typeof result === 'object' &&
    'visualize' in result &&
    result.visualize &&
    typeof result.visualize === 'object' &&
    'type' in result.visualize;

  const isVisualizationImage = hasVisualization && result.visualize!.type === 'image';

  return (
    <div key={index} className="text-sm my-1">
      {/* 搜索结果特殊处理 */}
      {hasSearchResults && (
        <CollapsibleDrawer title={`🌐 网络搜索结果 (${(result as any[]).length})`}>
          <div className="space-y-2">
            {(result as any[]).map((item, idx) => (
              <div key={idx} className="border-b pb-2 last:border-0 last:pb-0">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 truncate">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.url}
                  </a>
                </div>
                {item.domain && <div className="text-xs text-gray-500">来源: {item.domain}</div>}
              </div>
            ))}
          </div>
        </CollapsibleDrawer>
      )}

      {/* 可视化数据处理 */}
      {hasVisualization && (
        <div className="my-3">
          <VisualizationRenderer visualization={result.visualize!} />
        </div>
      )}

      {/* 图片结果特殊处理 */}
      {hasImageResult && !isVisualizationImage && (
        <div className="my-3 rounded-md overflow-hidden">
          <Image
            src={getProxyImageUrl(result.imageUrl as string)}
            alt={(result.prompt as string) || '生成的图像'}
            width={0}
            height={0}
            sizes="100vw"
            style={{ objectFit: 'contain' }}
            className="w-full h-auto max-h-[500px] rounded-md"
          />
        </div>
      )}

      {/* 工具调用详情 */}
      <CollapsibleDrawer title={`🔧 工具调用: ${toolName}`}>
        {part.input && (
          <div className="mt-1">
            <div className="font-medium text-blue-600 dark:text-blue-400">参数:</div>
            <div className="text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 p-2 rounded my-1">
              <pre className="text-xs overflow-auto">{JSON.stringify(part.input, null, 2)}</pre>
            </div>
          </div>
        )}

        {part.output !== undefined && !hasImageResult && !hasSearchResults && !hasVisualization && (
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="font-medium text-green-600 dark:text-green-400">结果:</div>
            <div className="text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 p-2 rounded my-1">
              <pre className="text-xs overflow-auto">
                {typeof part.output === 'string'
                  ? part.output
                  : JSON.stringify(part.output || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CollapsibleDrawer>
    </div>
  );
};

// 渲染旧版 tool-invocation 部分（兼容）
const renderLegacyToolInvocation = (
  toolInvocation: {
    toolName: string;
    args?: Record<string, unknown>;
    state?: string;
    result?: unknown;
  },
  index: number
) => {
  // 只显示state为result的工具调用
  if (toolInvocation.state !== 'result') {
    return null;
  }

  const result = (toolInvocation.result || {}) as ToolInvocationResult;

  // 检查是否有图片结果
  const hasImageResult =
    result && typeof result === 'object' && 'imageUrl' in result && result.imageUrl;

  // 检查是否有搜索结果
  const hasSearchResults =
    result &&
    Array.isArray(result) &&
    result.length > 0 &&
    result[0] &&
    typeof result[0] === 'object' &&
    'title' in result[0] &&
    'url' in result[0];

  // 检查是否有可视化数据
  const hasVisualization =
    result &&
    typeof result === 'object' &&
    'visualize' in result &&
    result.visualize &&
    typeof result.visualize === 'object' &&
    'type' in result.visualize;

  const isVisualizationImage = hasVisualization && result.visualize!.type === 'image';

  return (
    <div key={index} className="text-sm my-1">
      {/* 搜索结果特殊处理 */}
      {hasSearchResults && (
        <CollapsibleDrawer title={`🌐 网络搜索结果 (${(result as any[]).length})`}>
          <div className="space-y-2">
            {(result as any[]).map((item, idx) => (
              <div key={idx} className="border-b pb-2 last:border-0 last:pb-0">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 truncate">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.url}
                  </a>
                </div>
                {item.domain && <div className="text-xs text-gray-500">来源: {item.domain}</div>}
              </div>
            ))}
          </div>
        </CollapsibleDrawer>
      )}

      {/* 可视化数据处理 */}
      {hasVisualization && (
        <div className="my-3">
          <VisualizationRenderer visualization={result.visualize!} />
        </div>
      )}

      {/* 图片结果特殊处理 */}
      {hasImageResult && !isVisualizationImage && (
        <div className="my-3 rounded-md overflow-hidden">
          <Image
            src={getProxyImageUrl(result.imageUrl as string)}
            alt={(result.prompt as string) || '生成的图像'}
            width={0}
            height={0}
            sizes="100vw"
            style={{ objectFit: 'contain' }}
            className="w-full h-auto max-h-[500px] rounded-md"
          />
        </div>
      )}

      {/* 工具调用详情 */}
      <CollapsibleDrawer title={`🔧 工具调用: ${toolInvocation.toolName || '未命名工具'}`}>
        {toolInvocation.args && (
          <div className="mt-1">
            <div className="font-medium text-blue-600 dark:text-blue-400">参数:</div>
            <div className="text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 p-2 rounded my-1">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(toolInvocation.args, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {toolInvocation.result !== undefined &&
          !hasImageResult &&
          !hasSearchResults &&
          !hasVisualization && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="font-medium text-green-600 dark:text-green-400">结果:</div>
              <div className="text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 p-2 rounded my-1">
                <pre className="text-xs overflow-auto">
                  {typeof toolInvocation.result === 'string'
                    ? toolInvocation.result
                    : JSON.stringify(toolInvocation.result || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
      </CollapsibleDrawer>
    </div>
  );
};

const renderPart = (
  part: any, // 使用 any 以支持 AI SDK v6 的动态类型
  index: number,
  showCopyButton: boolean,
  showOnly: ('reasoning' | 'tool-invocation' | 'tool' | 'source' | 'text')[],
  messageId: string = 'msg' // 用于生成稳定的块级 key
) => {
  const partType = part?.type as string;

  // 检查是否应该显示这个部分
  if (!shouldShowPart(partType, showOnly)) {
    return null;
  }

  // 处理 AI SDK v6 的 tool-xxx 类型
  if (partType.startsWith('tool-') && partType !== 'tool-invocation') {
    return renderToolUIPart(part as ToolUIPartRuntime, index);
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
    case 'tool-invocation': {
      // 兼容旧版 tool-invocation 格式
      return renderLegacyToolInvocation(part.toolInvocation, index);
    }
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
      // 步骤边界不渲染任何内容
      return null;
    default:
      // 未知类型，静默跳过
      return null;
  }
};

// 工具调用数据，用于分组显示
interface ToolCallForGroup {
  toolName: string;
  toolCallId?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  state: string;
  originalPart: any;
  originalIndex: number;
}

function MessageContentAdapterComponent({
  content,
  showCopyButton = false,
  showOnly = [],
  messageId = 'msg',
}: MessageContentAdapterProps) {
  if (typeof content === 'string') {
    return (
      <MessageContentComponent content={content} showCopyButton={showCopyButton} id={messageId} />
    );
  }

  if (Array.isArray(content)) {
    // 分离工具调用和其他内容
    const toolCalls: ToolCallForGroup[] = [];
    const otherParts: { part: any; index: number }[] = [];

    content.forEach((part, index) => {
      const partType = part?.type as string;

      // 检查是否应该显示这个部分
      if (!shouldShowPart(partType, showOnly)) {
        return;
      }

      // 收集工具调用
      if (partType.startsWith('tool-') && partType !== 'tool-invocation') {
        const toolPart = part as ToolUIPartRuntime;
        // 只收集 output-available 状态的工具调用用于分组显示
        if (toolPart.state === 'output-available') {
          toolCalls.push({
            toolName: toolPart.toolName || partType.replace('tool-', ''),
            toolCallId: toolPart.toolCallId,
            input: toolPart.input,
            output: toolPart.output,
            state: toolPart.state,
            originalPart: part,
            originalIndex: index,
          });
        }
      } else if (partType === 'tool-invocation') {
        const toolInvocation = part.toolInvocation;
        if (toolInvocation?.state === 'result') {
          toolCalls.push({
            toolName: toolInvocation.toolName || '未命名工具',
            input: toolInvocation.args,
            output: toolInvocation.result,
            state: 'result',
            originalPart: part,
            originalIndex: index,
          });
        }
      } else {
        otherParts.push({ part, index });
      }
    });

    // 渲染非工具内容
    const renderedOtherParts = otherParts
      .map(({ part, index }) => renderPart(part, index, showCopyButton, showOnly, messageId))
      .filter(Boolean);

    // 如果没有任何可渲染的内容，返回空
    if (renderedOtherParts.length === 0 && toolCalls.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-col gap-3">
        {renderedOtherParts}
        {toolCalls.length > 0 && (
          <ToolCallsGroup
            toolCalls={toolCalls}
            renderToolDetail={call => renderToolDetailContent(call)}
          />
        )}
      </div>
    );
  }

  return <div className="text-red-500">无法显示消息内容</div>;
}

// 工具调用基础数据类型（与 ToolCallsGroup 组件兼容）
interface ToolCallBaseData {
  toolName: string;
  toolCallId?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  state: string;
}

// 渲染单个工具调用的详细内容（用于分组显示中的展开详情）
function renderToolDetailContent(call: ToolCallBaseData) {
  const result = (call.output || {}) as ToolInvocationResult;

  // 检查是否有图片结果
  const hasImageResult =
    result && typeof result === 'object' && 'imageUrl' in result && result.imageUrl;

  // 检查是否有搜索结果
  const hasSearchResults =
    result &&
    Array.isArray(result) &&
    result.length > 0 &&
    result[0] &&
    typeof result[0] === 'object' &&
    'title' in result[0] &&
    'url' in result[0];

  // 检查是否有可视化数据
  const hasVisualization =
    result &&
    typeof result === 'object' &&
    'visualize' in result &&
    result.visualize &&
    typeof result.visualize === 'object' &&
    'type' in result.visualize;

  const isVisualizationImage = hasVisualization && result.visualize!.type === 'image';

  return (
    <div className="text-xs space-y-2">
      {/* 搜索结果特殊处理 */}
      {hasSearchResults && (
        <div className="space-y-1.5">
          <div className="font-medium text-blue-600 dark:text-blue-400">
            🌐 搜索结果 ({(result as any[]).length})
          </div>
          <div className="space-y-1 max-h-40 overflow-auto">
            {(result as any[]).slice(0, 5).map((item, idx) => (
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
            {(result as any[]).length > 5 && (
              <div className="text-gray-500 text-center">
                还有 {(result as any[]).length - 5} 条结果...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 可视化数据处理 */}
      {hasVisualization && (
        <div className="my-2">
          <VisualizationRenderer visualization={result.visualize!} />
        </div>
      )}

      {/* 图片结果特殊处理 */}
      {hasImageResult && !isVisualizationImage && (
        <div className="my-2 rounded-md overflow-hidden">
          <Image
            src={getProxyImageUrl(result.imageUrl as string)}
            alt={(result.prompt as string) || '生成的图像'}
            width={0}
            height={0}
            sizes="100vw"
            style={{ objectFit: 'contain' }}
            className="w-full h-auto max-h-[300px] rounded-md"
          />
        </div>
      )}

      {/* 参数 */}
      {call.input && (
        <div>
          <div className="font-medium text-blue-600 dark:text-blue-400 mb-1">参数:</div>
          <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-24 text-[10px]">
            {JSON.stringify(call.input, null, 2)}
          </pre>
        </div>
      )}

      {/* 结果 */}
      {call.output !== undefined && !hasImageResult && !hasSearchResults && !hasVisualization && (
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
}

// 不在这一层使用 memo，让流式内容能够正常更新
// 性能优化在子组件 MemoizedMarkdownBlock 中实现块级 memoization
// 这样已完成的块保持缓存，只有当前流式输出的块会重新渲染
export const MessageContentAdapter = MessageContentAdapterComponent;
