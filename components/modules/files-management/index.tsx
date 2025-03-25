'use client';
import { useEffect, useRef } from 'react';
import Loading from '@/components/loading';
import AddNewDoc from './add-new-doc';
import Embedding from './embedding';
import FilesTable from './files-table';
import Delete from './delete';
import UploadProgress from './progress';
import useFilesManagementStore from './store';

export default function FilesManagement() {
  const renderCount = useRef(0);
  const { getTableData, isLoading } = useFilesManagementStore();

  useEffect(() => {
    if (renderCount.current > 0) return;
    renderCount.current++;
    getTableData();
  }, [getTableData]);

  return (
    <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex gap-4 justify-between mb-6">
        <div className="flex gap-4">
          <AddNewDoc />
          <Embedding />
        </div>
        <div className="flex gap-4">
          <Delete />
        </div>
      </div>
      <UploadProgress />
      <div className="pt-4">
        <FilesTable />
      </div>
      {isLoading ? (
        <div className="absolute w-full h-full bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm left-0 top-0 flex items-center justify-center z-50 rounded-lg">
          <Loading />
        </div>
      ) : null}
    </div>
  );
}
