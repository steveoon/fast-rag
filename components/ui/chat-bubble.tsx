'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageLoading } from '@/components/ui/message-loading';
import { CopyButton } from '@/components/ui/copy-button';

interface ChatBubbleProps {
  variant?: 'sent' | 'received';
  layout?: 'default' | 'ai';
  className?: string;
  children: React.ReactNode;
}

export function ChatBubble({ variant = 'received', className, children }: ChatBubbleProps) {
  return (
    <div
      className={cn(
        'flex items-end gap-3 mb-4',
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
        variant === 'sent' && 'flex-row-reverse',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ChatBubbleMessageProps {
  variant?: 'sent' | 'received';
  isLoading?: boolean;
  className?: string;
  children?: React.ReactNode;
  copyContent?: string;
}

export function ChatBubbleMessage({
  variant = 'received',
  isLoading,
  className,
  children,
  copyContent,
}: ChatBubbleMessageProps) {
  return (
    <div
      className={cn(
        'relative group',
        'rounded-2xl px-4 py-3 text-sm leading-relaxed',
        'transition-all duration-200 ease-out',
        variant === 'sent' && [
          // 移动端没有头像，消息可以更宽
          'ml-auto max-w-[92%] sm:max-w-[85%]',
          'bg-gradient-to-br from-blue-500 to-blue-600',
          'text-white',
          'shadow-md shadow-blue-500/20',
          'dark:from-blue-600 dark:to-blue-700',
          'dark:shadow-blue-600/30',
        ],
        variant === 'received' && [
          // 移动端没有头像，消息可以更宽
          'mr-auto max-w-[92%] sm:max-w-[85%]',
          'bg-white/90 backdrop-blur-sm',
          'text-gray-800',
          'shadow-sm',
          'border border-gray-100',
          'dark:bg-gray-800/90',
          'dark:text-gray-200',
          'dark:border-gray-700/50',
          'dark:shadow-none',
        ],
        className
      )}
    >
      {isLoading ? (
        <div className="flex items-center space-x-1.5 px-1 py-0.5">
          <MessageLoading />
        </div>
      ) : (
        children
      )}

      {/* 复制按钮 - 悬停时显示 */}
      {copyContent && !isLoading && (
        <CopyButton
          value={copyContent}
          className={cn(
            'absolute opacity-0 group-hover:opacity-100',
            // 根据消息类型调整位置
            variant === 'sent' && '-left-9 top-1',
            variant === 'received' && '-right-9 top-1',
            // 覆盖默认样式，使其更适合聊天气泡
            'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
            'hover:bg-gray-200/60 dark:hover:bg-gray-700/60'
          )}
        />
      )}
    </div>
  );
}

interface ChatBubbleAvatarProps {
  src?: string;
  fallback?: string;
  icon?: React.ReactNode;
  variant?: 'user' | 'assistant';
  className?: string;
}

export function ChatBubbleAvatar({
  src,
  fallback = 'AI',
  icon,
  variant = 'assistant',
  className,
}: ChatBubbleAvatarProps) {
  return (
    <Avatar
      className={cn(
        // 移动端隐藏头像，节省空间
        'hidden sm:flex',
        'h-9 w-9 shrink-0 ring-2 ring-offset-2 ring-offset-background',
        variant === 'user' && [
          'bg-gradient-to-br from-blue-500 to-blue-600',
          'ring-blue-200 dark:ring-blue-800',
        ],
        variant === 'assistant' && [
          'bg-gradient-to-br from-gray-100 to-gray-200',
          'ring-gray-200 dark:ring-gray-700',
          'dark:from-gray-700 dark:to-gray-800',
        ],
        className
      )}
    >
      {src ? (
        <AvatarImage src={src} />
      ) : icon ? (
        <AvatarFallback className="bg-transparent">{icon}</AvatarFallback>
      ) : (
        <AvatarFallback>{fallback}</AvatarFallback>
      )}
    </Avatar>
  );
}

interface ChatBubbleActionProps {
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ChatBubbleAction({ icon, onClick, className }: ChatBubbleActionProps) {
  return (
    <Button variant="ghost" size="icon" className={cn('h-6 w-6', className)} onClick={onClick}>
      {icon}
    </Button>
  );
}

export function ChatBubbleActionWrapper({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn('flex items-center gap-1 mt-2', className)}>{children}</div>;
}
