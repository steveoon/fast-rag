import { getPublicTools } from '@/lib/actions/tools-quire/get-tools';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { Suspense } from 'react';
import TranslationWrapper from '@/components/auth-translations';
import { ToolActions } from './components/tool-actions';
import { ToolsGrid } from './components/tools-grid';

export default async function ToolsManagementPage() {
  // 从数据库获取工具列表
  const { tools, error } = await getPublicTools();

  return (
    <TranslationWrapper namespace="Platform.ToolsManagement">
      {t => (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h4 className="text-xl font-semibold text-blue-900 dark:text-blue-300">
              {t('subtitle2')}
            </h4>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-2 text-blue-900 dark:text-blue-300">
                {t('totalTools', { count: tools?.length || 0 })}
              </Badge>

              {/* 工具操作组件 */}
              <ToolActions />
            </div>
          </div>

          {error ? (
            <div className="bg-destructive/15 p-4 rounded-md flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
              <span>{t('error', { error })}</span>
            </div>
          ) : (
            <Suspense fallback={<div>{t('loading')}</div>}>
              <ToolsGrid tools={tools || []} loadingMessage={t('loading')} />
            </Suspense>
          )}
        </div>
      )}
    </TranslationWrapper>
  );
}
