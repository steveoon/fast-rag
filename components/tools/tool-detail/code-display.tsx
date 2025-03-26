import { CodeBlock } from '@/components/ui/CodeBlock';
import { cn } from '@/lib/utils';

interface CodeDisplayProps {
  code: unknown;
  emptyMessage: string;
  className?: string;
}

export function CodeDisplay({ code, emptyMessage, className = '' }: CodeDisplayProps) {
  if (!code) {
    return (
      <div
        className={cn(
          'text-center py-4 text-gray-500 dark:text-gray-400 border border-dashed rounded-lg',
          className
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  const codeString = typeof code === 'string' ? code : JSON.stringify(code, null, 2);
  const language = typeof code === 'string' ? 'text' : 'json';

  return <CodeBlock code={codeString} language={language} className={className} />;
}
