'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { Loader2, Check, Wrench, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';

// 定义状态数据的接口，与实际数据结构匹配
interface StatusData {
  type: string;
  text?: string | null;
  stepType?: string;
  hasToolCall?: boolean;
  tool?: string[] | []; // For stepComplete
  status?: string; // For toolStatus
  message?: string; // For toolStatus
  [key: string]: unknown; // 使用 unknown 兼容其他属性
}

// 组件 Props 类型
interface ChatBotToolStatusProps {
  // 接受任何类型的数据，因为AI SDK返回的是JSONValue[]
  data: unknown[] | undefined;
  isProcessing: boolean;
}

function ChatBotToolStatusComponent({ data, isProcessing }: ChatBotToolStatusProps) {
  const t = useTranslations('ChatBot.toolStatus');
  const [currentStatus, setCurrentStatus] = useState<StatusData | null>(null);

  // 获取工具名称的显示文本
  const getToolName = useCallback(
    (toolName: string | string[] | undefined) => {
      if (!toolName) return '';
      const name = Array.isArray(toolName) ? toolName[0] : toolName;
      return t(`tools.${name}`, { fallback: name });
    },
    [t]
  );

  // 监听数据变化和处理状态，更新当前状态
  useEffect(() => {
    if (!isProcessing) {
      setCurrentStatus(null); // 处理完成，立即清除状态
      return;
    }

    // 仅在处理中时更新状态
    if (data && data.length > 0) {
      const lastItem = data[data.length - 1] as Record<string, unknown>;
      // 确保数据格式符合预期
      if (lastItem && typeof lastItem === 'object' && 'type' in lastItem) {
        // 使用函数式更新以避免依赖旧状态
        setCurrentStatus(() => lastItem as unknown as StatusData);
      } else {
        // 无效数据项，显示默认处理中
        setCurrentStatus(() => ({ type: 'text', text: 'PROCESSING' }));
      }
    } else {
      // 正在处理但还没有状态数据（例如初始提交）
      setCurrentStatus(() => ({ type: 'text', text: 'PROCESS START' }));
    }
  }, [data, isProcessing]);

  // 如果没有状态可以显示，则不渲染任何内容
  if (!currentStatus) {
    return null;
  }

  // 根据当前状态生成要显示的内容
  const renderStatusContent = () => {
    // 特殊处理PROCESS START 或默认PROCESSING
    if (currentStatus.type === 'text') {
      const isPreparing = currentStatus.text === 'PROCESS START';
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>{isPreparing ? t('preparing') : t('processing')}</span>
        </>
      );
    }

    // 处理 toolStatus 类型
    if (currentStatus.type === 'toolStatus') {
      let icon;
      switch (currentStatus.status) {
        case 'searching':
          icon = <Search className="mr-1 h-3.5 w-3.5 animate-pulse text-blue-500" />;
          break;
        case 'retrieving':
          icon = <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin text-blue-500" />;
          break;
        case 'complete':
          icon = <Check className="mr-1 h-3.5 w-3.5 text-green-500" />;
          break;
        default:
          icon = <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />;
      }
      return (
        <>
          <Wrench className="mr-2 h-4 w-4 text-gray-500" />
          <span className="flex items-center">
            {icon}
            {currentStatus.message || t('processing')}
          </span>
        </>
      );
    }

    // 处理工具调用阶段 (stepComplete, initial)
    if (
      currentStatus.type === 'stepComplete' &&
      currentStatus.stepType === 'initial' &&
      currentStatus.hasToolCall
    ) {
      return (
        <>
          <Wrench className="mr-2 h-4 w-4 animate-pulse text-blue-500" />
          <span>
            {t('usingTool')}&nbsp;
            {currentStatus.tool && currentStatus.tool.length > 0 && (
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {getToolName(currentStatus.tool)}
              </span>
            )}
          </span>
        </>
      );
    }

    // 处理工具结果阶段 (stepComplete, tool-result)
    if (currentStatus.type === 'stepComplete' && currentStatus.stepType === 'tool-result') {
      return (
        <>
          <Check className="mr-2 h-4 w-4 text-green-500" />
          <span>{t('toolCompleted')}</span>
        </>
      );
    }

    // 处理最终完成阶段 (stepComplete, final)
    if (currentStatus.type === 'stepComplete' && currentStatus.stepType === 'final') {
      return (
        <>
          <Check className="mr-2 h-4 w-4 text-green-500" />
          <span>{t('processingComplete')}</span>
        </>
      );
    }

    return null; // 其他未知状态不显示
  };

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
        {renderStatusContent()}
      </div>
    </div>
  );
}

// 使用memo包装组件，只有当props实际变化时才重新渲染
export const ChatBotToolStatus = memo(ChatBotToolStatusComponent, (prevProps, nextProps) => {
  // 检查processing状态是否相同
  if (prevProps.isProcessing !== nextProps.isProcessing) {
    return false; // 状态不同，需要重新渲染
  }

  // 检查data数组长度是否相同
  const prevLength = prevProps.data?.length || 0;
  const nextLength = nextProps.data?.length || 0;
  if (prevLength !== nextLength) {
    return false; // 长度不同，需要重新渲染
  }

  // 如果两者都为空，则认为相等
  if (prevLength === 0 && nextLength === 0) {
    return true;
  }

  // 检查最后一个元素是否相同
  if (prevProps.data && nextProps.data) {
    const prevLast = prevProps.data[prevLength - 1];
    const nextLast = nextProps.data[nextLength - 1];

    // 简单比较，检查是否是相同的对象引用
    return prevLast === nextLast;
  }

  return true; // 默认情况下认为相等，避免不必要的重新渲染
});
