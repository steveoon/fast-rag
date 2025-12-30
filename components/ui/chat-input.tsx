import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const ChatInput = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <Textarea
    autoComplete="off"
    ref={ref}
    name="message"
    className={cn(
      // 移动端使用 16px 字体防止 iOS 自动缩放
      'max-h-12 px-4 py-3 bg-background text-base sm:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full rounded-md flex items-center h-16 resize-none',
      className
    )}
    {...props}
  />
));
ChatInput.displayName = 'ChatInput';

export { ChatInput };
