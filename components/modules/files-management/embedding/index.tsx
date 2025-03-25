import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import useFilesManagementStore from '../store';
import { Database } from 'lucide-react';

export default function Embedding() {
  const t = useTranslations('Platform.FilesManagement');
  const { batchEmbedding, selectedFiles, isOperation } = useFilesManagementStore();

  return (
    <Button
      onClick={batchEmbedding}
      disabled={isOperation || selectedFiles.length === 0}
      className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600"
    >
      <Database className="mr-2 h-4 w-4" />
      {t('Operation.batchEmbedding')}
    </Button>
  );
}
