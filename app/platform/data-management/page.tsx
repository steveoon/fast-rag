import FilesManagement from '@/components/modules/files-management';
import TranslationWrapper from '@/components/auth-translations';

export default async function DataManagementPage() {
  return (
    <TranslationWrapper namespace="Platform.FilesManagement">
      {t => (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-blue-900 mb-4 dark:text-blue-300">
              {t('title')}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
          </div>

          <FilesManagement />
        </div>
      )}
    </TranslationWrapper>
  );
}
