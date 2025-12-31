'use client';

import { memo } from 'react';
import { Loader2, Check, Sparkles, Brain, Wrench } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChatBotToolStatusProps } from '../types';

function ChatBotToolStatusComponent({ processingStatus, isProcessing }: ChatBotToolStatusProps) {
  const t = useTranslations('ChatBot.toolStatus');

  // 如果没有状态可以显示，则不渲染任何内容
  if (!isProcessing || !processingStatus) {
    return null;
  }

  // 根据处理状态生成要显示的内容
  const renderStatusContent = () => {
    switch (processingStatus.status) {
      case 'started':
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-500" />
            <span>{processingStatus.message || t('preparing')}</span>
          </>
        );

      case 'analyzing':
        return (
          <>
            <Brain className="mr-2 h-4 w-4 animate-pulse text-purple-500" />
            <span>{processingStatus.message || t('analyzing')}</span>
          </>
        );

      case 'toolCalling':
        return (
          <>
            <Wrench className="mr-2 h-4 w-4 animate-pulse text-orange-500" />
            <span>{processingStatus.message || t('usingTool')}</span>
          </>
        );

      case 'generating':
        return (
          <>
            <Sparkles className="mr-2 h-4 w-4 animate-pulse text-blue-500" />
            <span>{processingStatus.message || t('generating')}</span>
          </>
        );

      case 'completed':
        return (
          <>
            <Check className="mr-2 h-4 w-4 text-green-500" />
            <span>{processingStatus.message || t('processingComplete')}</span>
          </>
        );

      default:
        return (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>{t('processing')}</span>
          </>
        );
    }
  };

  // 返回完整的状态组件
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
        {renderStatusContent()}
      </div>
      {/* 可选的进度条 */}
      {processingStatus.progress !== undefined && processingStatus.progress > 0 && (
        <div className="mt-1 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${processingStatus.progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// 使用memo包装组件，只有当props实际变化时才重新渲染
export const ChatBotToolStatus = memo(ChatBotToolStatusComponent, (prevProps, nextProps) => {
  // 检查processing状态是否相同
  if (prevProps.isProcessing !== nextProps.isProcessing) {
    return false; // 状态不同，需要重新渲染
  }

  // 检查processingStatus是否相同
  if (prevProps.processingStatus?.status !== nextProps.processingStatus?.status) {
    return false;
  }

  if (prevProps.processingStatus?.message !== nextProps.processingStatus?.message) {
    return false;
  }

  if (prevProps.processingStatus?.progress !== nextProps.processingStatus?.progress) {
    return false;
  }

  return true; // 默认情况下认为相等，避免不必要的重新渲染
});
