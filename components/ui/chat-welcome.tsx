'use client';

import { useMemo } from 'react';
import { Bot, Sparkles, MessageSquare, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface ChatWelcomeProps {
  botName?: string;
  exampleQuestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export function ChatWelcome({
  botName = 'AI Assistant',
  exampleQuestions,
  onSuggestionClick,
}: ChatWelcomeProps) {
  const t = useTranslations('ChatBot.welcome');

  const icons = [Sparkles, MessageSquare, Zap];

  // 使用自定义问题或默认翻译
  const suggestions = useMemo(() => {
    const defaultSuggestions = [
      { icon: Sparkles, text: t('suggestion1') },
      { icon: MessageSquare, text: t('suggestion2') },
      { icon: Zap, text: t('suggestion3') },
    ];

    // 检查是否有有效的自定义问题
    if (exampleQuestions && exampleQuestions.some(q => q?.trim())) {
      return exampleQuestions
        .filter(q => q?.trim())
        .map((text, i) => ({
          icon: icons[i % 3],
          text,
        }));
    }

    return defaultSuggestions;
  }, [exampleQuestions, t]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-8">
      {/* Logo 区域 */}
      <div className="relative mb-8">
        {/* 背景光晕 */}
        <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full scale-150 animate-pulse-slow" />

        {/* 图标容器 */}
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25">
          <Bot className="w-10 h-10 text-white animate-float-slow" />
        </div>
      </div>

      {/* 标题 */}
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-2">{botName}</h2>

      {/* 副标题 */}
      <p className="text-gray-500 dark:text-gray-400 text-center mb-8 max-w-md">{t('subtitle')}</p>

      {/* 建议问题 */}
      <div className="flex flex-col gap-3 w-full max-w-md">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick?.(suggestion.text)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl',
              'bg-white/60 dark:bg-gray-800/60',
              'border border-gray-200/50 dark:border-gray-700/50',
              'hover:bg-white dark:hover:bg-gray-800',
              'hover:border-blue-300 dark:hover:border-blue-600',
              'hover:shadow-md hover:shadow-blue-500/10',
              'transition-all duration-200',
              'text-left text-gray-700 dark:text-gray-200',
              'group cursor-pointer'
            )}
          >
            <suggestion.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            <span className="text-sm">{suggestion.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
