import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import useFilesManagementStore from '../store';
import { Trash2 } from 'lucide-react';

export default function Delete() {
  const t = useTranslations('Platform.FilesManagement');
  const { deleteFiles, selectedFiles, isOperation } = useFilesManagementStore();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
          disabled={isOperation || selectedFiles.length === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t('Operation.delete')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600 dark:text-red-400">
            {t('Messages.deleteDialogTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>{t('Messages.deleteDialogDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-gray-200 dark:border-gray-800">
            {t('Operation.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={deleteFiles}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          >
            {t('Operation.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
