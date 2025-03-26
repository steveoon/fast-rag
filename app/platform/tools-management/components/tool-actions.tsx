'use client';

import { Button } from '@/components/ui/button';
import { useSelectedToolsStore } from '@/components/tools/selected-tools-store';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

export function ToolActions() {
  const t = useTranslations('Platform.ToolsManagement.Actions');

  const {
    isSelectionMode,
    toggleSelectionMode,
    selectedTools,
    clearSelection,
    applySelectedTools,
    isApplying,
  } = useSelectedToolsStore();

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={isSelectionMode ? 'default' : 'outline'}
        onClick={toggleSelectionMode}
        size="sm"
        className={`flex items-center ${isSelectionMode ? 'bg-gray-500 dark:bg-gray-700 hover:bg-gray-600 dark:hover:bg-gray-800' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
      >
        {isSelectionMode ? t('exitSelectionMode') : t('selectTools')}
      </Button>

      {isSelectionMode && (
        <>
          <Button
            variant="default"
            onClick={applySelectedTools}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={selectedTools.length === 0 || isApplying}
          >
            {isApplying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {t('applySelected', { count: selectedTools.length })}
          </Button>

          <Button
            variant="ghost"
            onClick={clearSelection}
            size="sm"
            disabled={selectedTools.length === 0 || isApplying}
          >
            {t('clear')}
          </Button>
        </>
      )}
    </div>
  );
}
