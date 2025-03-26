'use client';

import { ToolWithParameters } from '@/lib/actions/tools-quire/get-tools';
import { ToolCard } from './tool-card';
import { ToolApplyHandler } from './tool-apply-handler';
import { Suspense } from 'react';

interface ToolsGridProps {
  tools: ToolWithParameters[];
  loadingMessage: string;
}

export function ToolsGrid({ tools, loadingMessage }: ToolsGridProps) {
  return (
    <ToolApplyHandler>
      {(handleApply, isApplying) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map(tool => (
            <Suspense key={tool.id} fallback={<div>{loadingMessage}</div>}>
              <ToolCard tool={tool} onApply={handleApply} isApplying={isApplying} />
            </Suspense>
          ))}
        </div>
      )}
    </ToolApplyHandler>
  );
}
