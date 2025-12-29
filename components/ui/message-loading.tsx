'use client';

import { cn } from '@/lib/utils';

interface MessageLoadingProps {
  className?: string;
  variant?: 'dots' | 'skeleton';
}

function MessageLoading({ className, variant = 'dots' }: MessageLoadingProps) {
  if (variant === 'skeleton') {
    return (
      <div className={cn('flex flex-col gap-2 py-1', className)}>
        <div className="h-3 bg-gray-300/50 dark:bg-gray-600/50 rounded-full w-48 animate-pulse" />
        <div className="h-3 bg-gray-300/50 dark:bg-gray-600/50 rounded-full w-32 animate-pulse" />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={cn('w-2 h-2 rounded-full', 'bg-gray-400 dark:bg-gray-500', 'animate-bounce')}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
}

export { MessageLoading };
