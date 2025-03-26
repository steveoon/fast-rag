import { getPublicTools } from '@/lib/actions/tools-quire/get-tools';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { Suspense } from 'react';
import TranslationWrapper from '@/components/auth-translations';
import { ToolActions } from './components/tool-actions';
import { ToolsGrid } from './components/tools-grid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientToolsTab } from './components/client-tools-tab';
import { cn } from '@/lib/utils';

export default async function ToolsManagementPage() {
  // 从数据库获取工具列表
  const { tools, error } = await getPublicTools();

  return (
    <TranslationWrapper namespace="Platform.ToolsManagement">
      {t => (
        <div className="space-y-6">
          <Tabs defaultValue="system-tools" className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList className="bg-transparent py-2 px-0 h-auto font-semibold">
                <TabsTrigger
                  value="system-tools"
                  className={cn(
                    'text-blue-900 dark:text-blue-300 text-xl bg-transparent rounded-none px-2 py-1 data-[state=active]:bg-transparent',
                    'data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500',
                    'focus:outline-none focus:ring-0'
                  )}
                >
                  {t('systemTools')}
                </TabsTrigger>
                <TabsTrigger
                  value="client-tools"
                  className={cn(
                    'text-blue-900 dark:text-blue-300 text-xl bg-transparent rounded-none px-2 py-1 data-[state=active]:bg-transparent',
                    'data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-500',
                    'focus:outline-none focus:ring-0'
                  )}
                >
                  {t('clientTools')}
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="px-2 text-blue-900 dark:text-blue-300">
                  {t('totalTools', { count: tools?.length || 0 })}
                </Badge>

                {/* 工具操作组件 */}
                <ToolActions />
              </div>
            </div>

            <TabsContent value="system-tools">
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
            </TabsContent>

            <TabsContent value="client-tools">
              <Suspense fallback={<div>{t('loading')}</div>}>
                <ClientToolsTab />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </TranslationWrapper>
  );
}
