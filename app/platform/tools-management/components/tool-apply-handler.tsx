'use client';

import { useState } from 'react';
import { useSelectedToolsStore } from '@/components/tools/selected-tools-store';

interface ToolApplyHandlerProps {
  children: (
    handleApply: (toolId: string) => Promise<void>,
    isApplying: boolean
  ) => React.ReactNode;
}

export function ToolApplyHandler({ children }: ToolApplyHandlerProps) {
  const [applyingToolId, setApplyingToolId] = useState<string | null>(null);
  const { applySingleTool, isApplying } = useSelectedToolsStore();

  const handleApply = async (toolId: string) => {
    if (isApplying) return; // 如果已经有应用操作在进行中，不执行

    try {
      setApplyingToolId(toolId);
      await applySingleTool(toolId);
    } finally {
      setApplyingToolId(null);
    }
  };

  return <>{children(handleApply, !!applyingToolId || isApplying)}</>;
}
