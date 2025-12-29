import { marked } from 'marked';
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { CopyButton } from '@/components/ui/copy-button';
import { markdownComponents } from '@/components/markdown';

interface MessageContentProps {
  content: string;
  showCopyButton?: boolean;
  id?: string; // 用于生成稳定的 key
}

/**
 * 将 markdown 解析为独立的块
 * 官方推荐的模式：每个块单独 memoize，这样只有最后一个块会随着流式内容更新
 */
function parseMarkdownIntoBlocks(markdown: string): string[] {
  const tokens = marked.lexer(markdown);
  return tokens.map(token => token.raw);
}

/**
 * 单个 markdown 块的渲染组件
 * 使用 memo 确保内容不变时不会重新渲染
 */
const MemoizedMarkdownBlock = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    );
  },
  (prevProps, nextProps) => prevProps.content === nextProps.content
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

/**
 * 基于块的 markdown 组件（不使用 memo）
 * 将内容拆分为块，每个块独立 memoize
 * 这样流式输出时，已完成的块保持缓存，只有当前块会重新渲染
 */
function MemoizedMarkdown({ content, id }: { content: string; id: string }) {
  const blocks = useMemo(() => parseMarkdownIntoBlocks(content), [content]);

  return (
    <>
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock content={block} key={`${id}-block_${index}`} />
      ))}
    </>
  );
}

/**
 * 消息内容组件
 * 使用块级 memoization 优化流式渲染性能
 * 注意：不在这一层使用 memo，让流式内容能够正常更新
 */
export function MessageContent({
  content,
  showCopyButton = false,
  id = 'msg',
}: MessageContentProps) {
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
        <MemoizedMarkdown content={content} id={id} />
      </div>
    </div>
  );
}
