import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { cn } from '@/lib/utils';
import { Button } from './button-clip';
import { Check, Copy } from 'lucide-react';

interface Props {
  value: string;
  className?: string;
}

export const CopyButton = (props: Props) => {
  const { value, className } = props;
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const onCopy = () => {
    if (isCopied) return;
    copyToClipboard(value);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'relative h-7 w-7 rounded-md transition-all duration-200',
        'text-gray-400 hover:text-gray-100 dark:text-gray-500 dark:hover:text-gray-300',
        'hover:bg-gray-700/40 dark:hover:bg-gray-800/60 backdrop-blur-sm',
        'focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-900',
        isCopied ? 'bg-green-500/10 text-green-400' : '',
        className
      )}
      onClick={onCopy}
    >
      {isCopied ? (
        <Check className="h-4 w-4 transition-transform duration-200 animate-in zoom-in-50" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      <span className="sr-only">{isCopied ? '已复制' : '复制内容'}</span>
    </Button>
  );
};
