import { MessageContent as MessageContentComponent } from '@/hooks/message-content';
import { memo } from 'react';
import Image from 'next/image';
import { MessageContent, MessagePart } from '@/app/chat-bot/[id]/types';

interface MessageContentAdapterProps {
  content: MessageContent;
  showCopyButton?: boolean;
}

const renderPart = (part: MessagePart, index: number, showCopyButton: boolean) => {
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
      return (
        <div key={index} className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded-md my-1">
          <div className="font-medium text-blue-600 dark:text-blue-400">
            🔧 工具调用: {toolInvocation.toolName || '未命名工具'}
          </div>
          {toolInvocation.args && (
            <div className="mt-1 text-gray-700 dark:text-gray-300">
              <MessageContentComponent
                content={JSON.stringify(toolInvocation.args, null, 2)}
                showCopyButton={false}
              />
            </div>
          )}
          {toolInvocation.state === 'result' && toolInvocation.result !== undefined && (
            <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
              <div className="font-medium text-green-600 dark:text-green-400">✓ 结果</div>
              <div className="mt-1 text-gray-700 dark:text-gray-300">
                <MessageContentComponent
                  content={
                    typeof toolInvocation.result === 'string'
                      ? toolInvocation.result
                      : JSON.stringify(toolInvocation.result || {}, null, 2)
                  }
                  showCopyButton={false}
                />
              </div>
            </div>
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
}: MessageContentAdapterProps) {
  if (typeof content === 'string') {
    return <MessageContentComponent content={content} showCopyButton={showCopyButton} />;
  }

  if (Array.isArray(content)) {
    return (
      <div className="flex flex-col gap-3">
        {content.map((part, index) => renderPart(part, index, showCopyButton))}
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
        prevProps.showCopyButton === nextProps.showCopyButton
      );
    }

    if (Array.isArray(prevProps.content) && Array.isArray(nextProps.content)) {
      return (
        prevProps.content.length === nextProps.content.length &&
        prevProps.showCopyButton === nextProps.showCopyButton
      );
    }

    return false;
  }
);
