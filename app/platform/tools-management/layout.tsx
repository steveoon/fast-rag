import TranslationWrapper from '@/components/auth-translations';

export default function ToolsManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <TranslationWrapper namespace="Platform.ToolsManagement">
      {t => (
        <div className="container mx-auto py-6">
          <div className="pb-6 border-b">
            <h1 className="text-4xl font-bold text-blue-900 dark:text-blue-300 mb-4">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">{t('subtitle1')}</p>
          </div>
          <div className="py-6">{children}</div>
        </div>
      )}
    </TranslationWrapper>
  );
}
