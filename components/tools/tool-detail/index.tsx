'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { ToolWithParameters } from '@/lib/actions/tools-quire/get-tools';
import { useTranslations } from 'next-intl';
import { Wrench, Info, Code, Settings, FileJson, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from './status-badge';
import { SectionCard } from './section-card';
import { InfoField } from './info-field';
import { ParametersTable } from './parameters-table';
import { CodeDisplay } from './code-display';

interface ToolDetailProps {
  tool: ToolWithParameters;
  isOpen: boolean;
  onClose: () => void;
}

export function ToolDetail({ tool, isOpen, onClose }: ToolDetailProps) {
  const t = useTranslations('Platform.ToolsManagement');

  if (!tool) return null;

  // 根据状态决定标题栏的颜色
  const statusColors = {
    active:
      'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-b border-blue-200 dark:border-blue-800',
    deprecated:
      'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/50 border-b border-amber-200 dark:border-amber-800',
    disabled:
      'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-b border-red-200 dark:border-red-800',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden rounded-lg">
        <div
          className={cn(
            'px-6 py-4 relative',
            statusColors[tool.status as keyof typeof statusColors] || statusColors.active
          )}
        >
          <div className="flex items-start gap-3 pr-8">
            <div className="w-10 h-10 flex-shrink-0 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 shadow-sm">
              <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {tool.display_name}
              </DialogTitle>
              <DialogDescription className="mt-1 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center">
                  <Code className="h-3.5 w-3.5 mr-1 text-gray-500 dark:text-gray-500" />
                  {t('technicalIdentifier')}: <span className="font-mono ml-1">{tool.name}</span>
                </span>
                <span className="flex items-center">
                  <ExternalLink className="h-3.5 w-3.5 mr-1 text-gray-500 dark:text-gray-500" />
                  {t('version')}: <span className="font-semibold ml-1">{tool.version}</span>
                </span>
                <StatusBadge
                  status={tool.status as 'active' | 'deprecated' | 'disabled'}
                  className="ml-auto"
                />
              </DialogDescription>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(85vh-6rem)] px-6 py-4">
          <div className="space-y-6">
            {/* 描述部分 */}
            <SectionCard title={t('description')} icon={Info}>
              <p className="text-gray-600 dark:text-gray-400">{tool.description}</p>
            </SectionCard>

            {/* 实现细节部分 */}
            <SectionCard title={t('implementationDetails')} icon={Code}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label={t('implementationKey')}>
                  <p className="font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-gray-700 dark:text-gray-400">
                    {tool.implementation_key}
                  </p>
                </InfoField>

                <InfoField label={t('visibility')}>
                  <StatusBadge
                    status={tool.is_public ? 'public' : 'private'}
                    label={tool.is_public ? t('public') : t('private')}
                    className="mt-1"
                  />
                </InfoField>
              </div>
            </SectionCard>

            {/* 参数部分 */}
            <SectionCard title={t('parameters')} icon={Settings}>
              <ParametersTable parameters={tool.parameters} />
            </SectionCard>

            {/* 元数据部分 */}
            <SectionCard title={t('metadata')} icon={FileJson}>
              <CodeDisplay code={tool.metadata} emptyMessage={t('noMetadata')} />
            </SectionCard>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
