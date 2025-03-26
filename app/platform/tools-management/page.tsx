import { getPublicTools } from '@/lib/actions/tools-quire/get-tools';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { ToolCard } from './components/tool-card';
import { Suspense } from 'react';
import TranslationWrapper from '@/components/auth-translations';
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
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="px-2 text-blue-900 dark:text-blue-300">
                {t('totalTools', { count: tools?.length || 0 })}
              </Badge>
            </div>
          </div>

          {error ? (
            <div className="bg-destructive/15 p-4 rounded-md flex items-center">
              <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
              <span>{t('error', { error })}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools?.map(tool => (
                <Suspense key={tool.id} fallback={<div>{t('loading')}</div>}>
                  <ToolCard tool={tool} />
                </Suspense>
              ))}
            </div>
          )}
        </div>
      )}
    </TranslationWrapper>
  );
}
