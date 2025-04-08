/* eslint-disable @typescript-eslint/no-explicit-any */
import { MessageContent as MessageContentComponent } from '@/hooks/message-content';
import { memo } from 'react';
import Image from 'next/image';
import { MessageContent, MessagePart } from '@/app/chat-bot/[id]/types';
import { CollapsibleDrawer } from '@/components/ui/collapsible-drawer';

interface MessageContentAdapterProps {
  content: MessageContent;
  showCopyButton?: boolean;
  showOnly?: ('reasoning' | 'tool-invocation' | 'source' | 'text')[];
}

const renderPart = (
  part: MessagePart,
  index: number,
  showCopyButton: boolean,
  showOnly: ('reasoning' | 'tool-invocation' | 'source' | 'text')[]
) => {
  // 如果设置了showOnly且当前part.type不在showOnly中，则不显示
  if (showOnly && showOnly.length > 0 && !showOnly.includes(part.type as any)) {
    return null;
  }

  switch (part.type) {
    case 'text':
      return (
        <MessageContentComponent
          key={index}
          content={part.text}
          showCopyButton={index === 0 && showCopyButton}
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
            <MessageContentComponent content={part.reasoning} showCopyButton={false} />
          </div>
        </div>
      );
    case 'tool-invocation': {
      const { toolInvocation } = part;

      // 只显示state为result的工具调用
      if (toolInvocation.state !== 'result') {
        return null;
      }

      // 检查是否有图片结果
      const hasImageResult =
        toolInvocation.result &&
        typeof toolInvocation.result === 'object' &&
        toolInvocation.result !== null &&
        'imageUrl' in toolInvocation.result;

      // 检查是否有搜索结果 - 修正判断方法
      const hasSearchResults =
        toolInvocation.result &&
        Array.isArray(toolInvocation.result) &&
        toolInvocation.result.length > 0 &&
        toolInvocation.result[0] &&
        typeof toolInvocation.result[0] === 'object' &&
        'title' in toolInvocation.result[0] &&
        'url' in toolInvocation.result[0];

      return (
        <div key={index} className="text-sm my-1">
          {/* 图片结果直接显示 */}
          {hasImageResult && (
            <div className="rounded-md overflow-hidden my-2">
              <Image
                src={
                  toolInvocation.result &&
                  typeof toolInvocation.result === 'object' &&
                  'imageUrl' in toolInvocation.result
                    ? (toolInvocation.result.imageUrl as string)
                    : ''
                }
                alt="生成的图片"
                width={400}
                height={400}
                className="object-contain rounded-md"
              />
            </div>
          )}

          {/* 搜索结果特殊处理 */}
          {hasSearchResults && (
            <CollapsibleDrawer
              title={`🌐 网络搜索结果 (${(toolInvocation.result as any[]).length})`}
            >
              <div className="space-y-2">
                {(toolInvocation.result as any[]).map((result, idx) => (
                  <div key={idx} className="border-b pb-2 last:border-0 last:pb-0">
                    <div className="font-medium">{result.title}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 truncate">
                      <a href={result.url} target="_blank" rel="noopener noreferrer">
                        {result.url}
                      </a>
                    </div>
                    {result.domain && (
                      <div className="text-xs text-gray-500">来源: {result.domain}</div>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleDrawer>
          )}

          {/* 其他工具调用结果放入折叠抽屉 */}
          {!hasImageResult && (
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

              {toolInvocation.result !== undefined && !hasImageResult && !hasSearchResults && (
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
          )}
        </div>
      );
    }
    case 'source': {
      const { source } = part;
      return (
        <div
          key={index}
          className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded-md my-1 border border-green-100 dark:border-green-800"
        >
          <div className="font-medium text-green-700 dark:text-green-300">
            📚 来源: {source.url || '未知来源'}
          </div>
          {source.text && typeof source.text === 'string' && (
            <div className="mt-1 text-gray-700 dark:text-gray-300">
              <MessageContentComponent content={source.text} showCopyButton={false} />
            </div>
          )}
        </div>
      );
    }
    case 'file':
      return (
        <div key={index} className="rounded-md overflow-hidden my-2">
          <Image
            src={`data:${part.mimeType};base64,${part.data}`}
            alt="媒体文件"
            width={400}
            height={400}
            className="object-contain"
          />
        </div>
      );
    default:
      return null;
  }
};

function MessageContentAdapterComponent({
  content,
  showCopyButton = false,
  showOnly = [],
}: MessageContentAdapterProps) {
  if (typeof content === 'string') {
    return <MessageContentComponent content={content} showCopyButton={showCopyButton} />;
  }

  if (Array.isArray(content)) {
    return (
      <div className="flex flex-col gap-3">
        {content.map((part, index) => renderPart(part, index, showCopyButton, showOnly))}
      </div>
    );
  }

  console.error('无法识别的消息内容格式:', content);
  return <div className="text-red-500">无法显示消息内容</div>;
}

export const MessageContentAdapter = memo(
  MessageContentAdapterComponent,
  (prevProps, nextProps) => {
    if (typeof prevProps.content === 'string' && typeof nextProps.content === 'string') {
      return (
        prevProps.content === nextProps.content &&
        prevProps.showCopyButton === nextProps.showCopyButton &&
        JSON.stringify(prevProps.showOnly) === JSON.stringify(nextProps.showOnly)
      );
    }

    if (Array.isArray(prevProps.content) && Array.isArray(nextProps.content)) {
      // 进行深度比较，确保内容变化时会更新
      if (prevProps.content.length !== nextProps.content.length) {
        return false;
      }

      // 比较每个部分的内容
      for (let i = 0; i < prevProps.content.length; i++) {
        const prevPart = prevProps.content[i];
        const nextPart = nextProps.content[i];

        if (prevPart.type !== nextPart.type) {
          return false;
        }

        // 比较text内容
        if (prevPart.type === 'text' && nextPart.type === 'text') {
          if (prevPart.text !== nextPart.text) {
            return false;
          }
        }

        // 比较reasoning内容
        if (prevPart.type === 'reasoning' && nextPart.type === 'reasoning') {
          if (prevPart.reasoning !== nextPart.reasoning) {
            return false;
          }
        }
      }

      return (
        prevProps.showCopyButton === nextProps.showCopyButton &&
        JSON.stringify(prevProps.showOnly) === JSON.stringify(nextProps.showOnly)
      );
    }

    return false;
  }
);
