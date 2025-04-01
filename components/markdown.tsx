import { FC, memo } from 'react';
import ReactMarkdown, { Options, Components } from 'react-markdown';
import { CodeBlock } from './ui/codeblockForMarkdown';
import { cn } from '@/lib/utils';

export const markdownComponents: Components = {
  p: ({ children, ...props }) => (
    <p className="mb-2 last:mb-0" {...props}>
      {children}
    </p>
  ),
  h1: ({ children, ...props }) => (
    <h1 className="mb-4 mt-6 text-xl font-bold" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mb-3 mt-5 text-lg font-semibold" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold" {...props}>
      {children}
    </h3>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-4 list-disc pl-6" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-4 list-decimal pl-6" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="mb-1 pl-1" {...props}>
      {children}
    </li>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-l-4 border-blue-500/30 dark:border-blue-500/40 pl-4 italic text-gray-700 dark:text-gray-300"
      {...props}
    >
      {children}
    </blockquote>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2"
      {...props}
    >
      {children}
    </a>
  ),
  code: props => {
    const { children, className, ...rest } = props;
    const match = /language-(\w+)/.exec(className || '');

    if (String(children) === '▍') {
      return <span className="mt-1 animate-pulse cursor-default">▍</span>;
    }

    if (!match) {
      return (
        <code
          className={cn(
            'rounded-sm bg-zinc-700/10 px-1 py-0.5 dark:bg-zinc-700/30 text-blue-600 dark:text-blue-400',
            className
          )}
          {...rest}
        >
          {children}
        </code>
      );
    }

    return <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} {...rest} />;
  },
  table: ({ children, ...props }) => (
    <div className="my-4 w-full overflow-x-auto">
      <table className="w-full border-collapse" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-gray-100 dark:bg-gray-800" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="border-b border-gray-200 dark:border-gray-700" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-3 text-gray-600 dark:text-gray-400" {...props}>
      {children}
    </td>
  ),
};

export const MemoizedReactMarkdown: FC<Options> = memo(
  ReactMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
