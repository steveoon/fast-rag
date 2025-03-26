'use client';

import { useEffect } from 'react';
import { AlertTriangle, InfoIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useClientToolsStore } from '@/components/tools/client-tools-store';
import { ClientToolCard } from './client-tool-card';

export function ClientToolsTab(): React.ReactElement {
  const { clientTools, isLoading, error, fetchClientTools } = useClientToolsStore();

  useEffect(() => {
    fetchClientTools();

    // 组件卸载时重置状态
    return () => {
      useClientToolsStore.getState().reset();
    };
  }, [fetchClientTools]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/15 p-4 rounded-md flex items-center">
        <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
        <span>{error}</span>
      </div>
    );
  }

  if (clientTools.length === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md flex items-center">
        <InfoIcon className="mr-2 h-4 w-4 text-blue-500" />
        <span>该客户端尚未应用任何工具</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clientTools.map(clientTool => (
        <ClientToolCard key={clientTool.id} clientTool={clientTool} />
      ))}
    </div>
  );
}
