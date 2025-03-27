'use client';

import { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type ClientInfo, getActiveClientInfo } from '@/lib/actions/get-active-client';
import { StatusBadge, type StatusType } from '@/components/tools/tool-detail/status-badge';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

export function ActiveClientDisplay() {
  const t = useTranslations('Platform.ActiveClientDisplay');
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 获取客户端信息并处理错误
  const fetchClientInfo = async () => {
    try {
      setLoading(true);
      const data = await getActiveClientInfo();
      setClientInfo(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching client info:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // 组件加载时获取数据，并设置轮询
  useEffect(() => {
    fetchClientInfo();

    // 每30秒刷新一次数据
    const intervalId = setInterval(() => {
      fetchClientInfo();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // 加载状态
  if (loading && !clientInfo) {
    return <Skeleton className="ml-4 h-8 w-40 rounded-full" />;
  }

  // 错误状态
  if (error && !clientInfo) {
    return (
      <div className="ml-4 py-1 px-3 text-xs bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-full border border-red-200 dark:border-red-800">
        {t('error')}
      </div>
    );
  }

  // 数据为空
  if (!clientInfo) {
    return (
      <div className="ml-4 py-1 px-3 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
        {t('noClient')}
      </div>
    );
  }

  // 将客户端状态映射到StatusBadge支持的状态类型
  const statusMap: Record<string, StatusType> = {
    active: 'active',
    pending: 'deprecated',
    disabled: 'disabled',
  };

  // 获取状态
  const status = statusMap[clientInfo.status] || 'disabled';

  // 状态显示文本
  const statusLabel =
    clientInfo.status === 'active'
      ? t('active')
      : clientInfo.status === 'pending'
        ? t('pending')
        : t('disabled');

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild className="cursor-help">
          <div className="flex items-center space-x-2 ml-4 bg-card/60 rounded-full px-3 py-1.5 border border-border/30 hover:bg-card/80 transition-colors">
            <StatusBadge status={status} label={statusLabel} className="text-xs px-2 py-0.5" />
            <span className="text-sm font-medium text-foreground/80 truncate max-w-[200px]">
              {clientInfo.name}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-4 space-y-2 max-w-xs bg-card">
          {/* 刷新按钮 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              fetchClientInfo();
            }}
            className="absolute top-1 right-1 p-1 text-xs text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
            asChild
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>

          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <span className="text-xs font-semibold text-muted-foreground">{t('id')}:</span>
            <span className="text-xs truncate">{clientInfo.id}</span>

            <span className="text-xs font-semibold text-muted-foreground">{t('name')}:</span>
            <span className="text-xs">{clientInfo.name}</span>

            <span className="text-xs font-semibold text-muted-foreground">{t('status')}:</span>
            <div className="flex items-center">
              <StatusBadge status={status} label={statusLabel} className="text-xs px-1.5 py-0" />
            </div>
          </div>

          {/* 上次更新时间 */}
          <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
            {t('lastUpdated')}: {new Date().toLocaleTimeString()}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
