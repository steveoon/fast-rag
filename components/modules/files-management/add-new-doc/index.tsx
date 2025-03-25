import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import useFilesManagementStore from '../store';
import { Plus } from 'lucide-react';

export default function AddNewDoc() {
  const [fileList, setFileList] = useState<File[]>([]);
  const [docNames, setDocNames] = useState<string[]>([]);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('Platform.FilesManagement.Operation');
  const { uploadFiles, isOperation } = useFilesManagementStore();

  const selectFilesTrigger = () => {
    const inputFIle = inputFileRef.current;
    if (!inputFIle) return;
    inputFIle.click();
  };

  const selectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setFileList(fileArray);
      setDocNames(fileArray.map(item => item.name));
    }
  };

  const updateDocName = (index: number, docName: string) => {
    setDocNames(prev => prev.map((name, docIndex) => (index === docIndex ? docName : name)));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            setFileList([]);
            setDocNames([]);
          }}
          disabled={isOperation}
          className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t('uploadNewDoc')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-blue-900 dark:text-blue-300">
            {t('uploadNewDoc')}
          </DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          <div>
            <Input
              className="hidden"
              ref={inputFileRef}
              type="file"
              multiple
              onChange={selectFiles}
            />
            <Button
              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950"
              onClick={selectFilesTrigger}
              variant="outline"
            >
              {t('selectFiles')}
            </Button>
          </div>
          <div className="py-4">
            {docNames.map((docName, index) => (
              <div className="py-2" key={index}>
                <Input
                  value={docName}
                  onChange={e => {
                    const docName = e.target.value;
                    updateDocName(index, docName);
                  }}
                  className="border-blue-200 focus:border-blue-500 dark:border-blue-800 dark:focus:border-blue-400"
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              onClick={() => {
                uploadFiles({ files: fileList, docNames });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              {t('confirm')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
