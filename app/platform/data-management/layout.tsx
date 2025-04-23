import TranslationWrapper from '@/components/auth-translations';
import { ActiveClientDisplay } from '@/components/active-client-display';

export default function DataManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <TranslationWrapper namespace="Platform.FilesManagement">
      {t => (
        <div className="container mx-auto py-6">
          <div className="pb-6 border-b">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold text-blue-900 dark:text-blue-300 mb-4">
                {t('title')}
              </h1>
              <ActiveClientDisplay />
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
          </div>
          <div className="py-6">{children}</div>
        </div>
      )}
    </TranslationWrapper>
  );
}
