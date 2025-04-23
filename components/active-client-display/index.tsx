'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StatusBadge, type StatusType } from '@/components/tools/tool-detail/status-badge';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';
import { useClientStore } from './client-store';

// Define a static mapping outside the component for better performance
const STATUS_MAP: Record<string, StatusType> = {
  active: 'active',
  pending: 'deprecated',
  disabled: 'disabled',
};

export function ActiveClientDisplay() {
  const t = useTranslations('Platform.ActiveClientDisplay');
  const { clientInfo, loading, error, lastUpdated, fetchClientInfo } = useClientStore();

  // Polling: fetch data on mount and then every 30 seconds
  useEffect(() => {
    fetchClientInfo();
    const intervalId = setInterval(() => fetchClientInfo(), 30000);
    return () => clearInterval(intervalId);
  }, [fetchClientInfo]);

  // Memoize status and label calculations
  const { status, statusLabel } = useMemo(() => {
    if (!clientInfo) {
      return { status: 'disabled' as StatusType, statusLabel: '' };
    }
    const currentStatus = STATUS_MAP[clientInfo.status] || 'disabled';
    let label = '';
    switch (clientInfo.status) {
      case 'active':
        label = t('active');
        break;
      case 'pending':
        label = t('pending');
        break;
      default:
        label = t('disabled');
    }
    return { status: currentStatus, statusLabel: label };
  }, [clientInfo, t]);

  // Memoize the refresh handler (moved above early returns to ensure hooks are called unconditionally)
  const handleRefresh = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      fetchClientInfo();
    },
    [fetchClientInfo]
  );

  // Early returns for loading, error, or no client data
  if (loading && !clientInfo) {
    return <Skeleton className="ml-4 h-8 w-40 rounded-full" />;
  }

  if (error && !clientInfo) {
    return (
      <div className="ml-4 py-1 px-3 text-xs bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 rounded-full border border-red-200 dark:border-red-800">
        {t('error', { error: error.message })}
      </div>
    );
  }

  if (!clientInfo) {
    return (
      <div className="ml-4 py-1 px-3 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
        {t('noClient')}
      </div>
    );
  }

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

          <div className="text-xs text-muted-foreground mt-2 pt-2 border-t flex items-center justify-between">
            {t('lastUpdated')}: {lastUpdated ? lastUpdated.toLocaleTimeString() : ''}
            {/* Refresh button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="text-xs text-muted-foreground hover:text-foreground rounded-full hover:bg-muted"
            >
              <RefreshCcw className="w-3 h-3" />
            </Button>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
