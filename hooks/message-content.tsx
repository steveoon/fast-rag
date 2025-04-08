import { MemoizedReactMarkdown, markdownComponents } from '@/components/markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { CopyButton } from '@/components/ui/copy-button';
import { memo } from 'react';

interface MessageContentProps {
  content: string;
  showCopyButton?: boolean;
}

// 使用memo优化组件，避免不必要的重渲染
function MessageContentComponent({ content, showCopyButton = false }: MessageContentProps) {
  if (!content) {
    return null;
  }

  return (
    <div className="relative">
      {showCopyButton && <CopyButton className="absolute -right-10 top-0" value={content} />}

      <div
        className="prose prose-sm dark:prose-invert break-words max-w-none 
                      prose-headings:font-semibold 
                      prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                      prose-pre:p-0 prose-pre:bg-transparent
                      prose-code:text-blue-600 dark:prose-code:text-blue-400
                      prose-code:before:content-none prose-code:after:content-none
                      prose-p:leading-relaxed prose-p:my-2
                      prose-li:my-0.5
                      prose-a:text-blue-600 dark:prose-a:text-blue-400
                      prose-img:rounded-md
                      prose-table:w-full prose-table:border-collapse
                      prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:p-3 prose-th:text-left
                      prose-td:p-3 prose-td:border-b prose-td:border-gray-200 dark:prose-td:border-gray-700
                      dark:text-zinc-300"
      >
        <MemoizedReactMarkdown
          key={content}
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={markdownComponents}
        >
          {content}
        </MemoizedReactMarkdown>
      </div>
    </div>
  );
}

// 使用memo包装组件，只有当content或showCopyButton发生变化时才重新渲染
export const MessageContent = memo(
  MessageContentComponent,
  (prevProps, nextProps) =>
    prevProps.content === nextProps.content && prevProps.showCopyButton === nextProps.showCopyButton
);
