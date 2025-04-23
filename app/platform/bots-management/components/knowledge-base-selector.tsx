'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LoaderCircle,
  FileText,
  FileIcon,
  Tag,
  Info,
  CheckCircle2,
  CirclePlus,
  CircleMinus,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useKnowledgeBaseStore } from '../store/knowledge-base-store';
import { Document } from '../store/knowledge-base-store';
import { useClientStore } from '@/components/active-client-display/client-store';

// 文档类型图标映射
const documentTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4 text-red-500" />,
  doc: <FileText className="h-4 w-4 text-blue-500" />,
  docx: <FileText className="h-4 w-4 text-blue-500" />,
  txt: <FileText className="h-4 w-4 text-gray-500" />,
  md: <FileText className="h-4 w-4 text-purple-500" />,
  // 可以根据需要添加更多类型
};

// 默认图标
const defaultIcon = <FileIcon className="h-4 w-4 text-gray-500" />;

interface KnowledgeBaseSelectorProps {
  botId: string;
  onSelectionChange?: (selectedVersionIds: string[]) => void;
  disabled?: boolean;
}

// 定义文档展示模式
type ViewMode = 'all' | 'assigned' | 'available';

export default function KnowledgeBaseSelector({
  botId,
  onSelectionChange,
  disabled = false,
}: KnowledgeBaseSelectorProps) {
  // 视图模式状态
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  // 获取多语言翻译函数
  const t = useTranslations('Platform.BotsManagement');

  // 从Store中获取状态和方法
  const {
    documents,
    assignedKnowledgeBases,
    selectedVersionIds,
    isLoading,
    error,
    openDocuments,
    fetchBotKnowledgeBases,
    toggleDocumentOpen,
    handleVersionSelection,
    handleDocumentSelection,
    clearAllSelections,
    getDocumentSelectionState,
  } = useKnowledgeBaseStore();

  // 监听当前活跃客户端变化
  const clientInfo = useClientStore(state => state.clientInfo);

  // 当 Client 变化时重置文档缓存
  useEffect(() => {
    if (clientInfo?.id) {
      // 仅重置文档缓存，保留当前选择状态
      useKnowledgeBaseStore.getState().resetDocumentsCache();

      // 如果有 botId，则重新获取数据
      if (botId) {
        fetchBotKnowledgeBases(botId);
      }
    }
  }, [clientInfo?.id, botId, fetchBotKnowledgeBases]);

  // 计算已分配的文档和可用文档
  const { assignedDocuments, availableDocuments } = useMemo(() => {
    // 提取所有已分配版本的文档ID集合
    const assignedDocIds = new Set(assignedKnowledgeBases.map(kb => kb.documentId));

    // 过滤文档列表
    const assigned = documents.filter(doc => assignedDocIds.has(doc.id));
    const available = documents.filter(doc => !assignedDocIds.has(doc.id));

    return {
      assignedDocuments: assigned,
      availableDocuments: available,
    };
  }, [documents, assignedKnowledgeBases]);

  // 当选择发生变化时通知父组件
  useEffect(() => {
    onSelectionChange?.(selectedVersionIds);
  }, [selectedVersionIds, onSelectionChange]);

  // 处理版本选择变更，需要考虑disabled状态
  const handleVersionSelectionChange = (versionId: string, checked: boolean) => {
    if (disabled) return;
    handleVersionSelection(versionId, checked);
  };

  // 处理文档全选/全不选，需要考虑disabled状态
  const handleDocumentSelectionChange = (documentId: string, checked: boolean) => {
    if (disabled) return;
    handleDocumentSelection(documentId, checked);
  };

  // 处理清空所有选择，需要考虑disabled状态
  const handleClearAll = () => {
    if (disabled) return;
    clearAllSelections();
  };

  // 检查版本是否已分配
  const isVersionAssigned = (versionId: string): boolean => {
    return assignedKnowledgeBases.some(kb => kb.documentVersionId === versionId);
  };

  // 过滤要显示的文档
  const getFilteredDocuments = (): Document[] => {
    switch (viewMode) {
      case 'assigned':
        return assignedDocuments;
      case 'available':
        return availableDocuments;
      case 'all':
      default:
        return documents;
    }
  };

  // 渲染文档卡片
  const renderDocumentCard = (document: Document) => {
    const documentSelection = getDocumentSelectionState(document.id);
    const docIcon = documentTypeIcons[document.type] || defaultIcon;
    const isOpen = openDocuments.has(document.id);
    const isAssigned = assignedDocuments.some(d => d.id === document.id);

    return (
      <div key={document.id} className="mb-2 border rounded-md overflow-hidden">
        {/* 文档标题行 */}
        <div
          className={`flex items-center px-4 py-3 ${
            isAssigned
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              : 'bg-gray-50 dark:bg-gray-800'
          }`}
        >
          <div className="flex items-center flex-1">
            <Checkbox
              id={`doc-${document.id}`}
              checked={documentSelection === true}
              onCheckedChange={checked => {
                handleDocumentSelectionChange(document.id, checked === true);
              }}
              disabled={disabled}
              className="mr-2 data-[state=indeterminate]:bg-blue-500"
              data-state={documentSelection === 'indeterminate' ? 'indeterminate' : undefined}
            />
            <Label
              htmlFor={`doc-${document.id}`}
              className="flex items-center cursor-pointer flex-1 text-left"
              onClick={e => {
                e.preventDefault();
                handleDocumentSelectionChange(document.id, documentSelection !== true);
              }}
            >
              <span className="mr-2">{docIcon}</span>
              <span className="font-medium">{document.name}</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {t('KnowledgeBase.versionsCount', { count: document.versions.length })}
              </Badge>

              {isAssigned && (
                <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {t('KnowledgeBase.assigned')}
                </Badge>
              )}
            </Label>
          </div>
          <div
            className="flex-shrink-0 text-gray-400 ml-2 p-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            onClick={() => toggleDocumentOpen(document.id)}
          >
            {isOpen ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </div>
        </div>

        {/* 版本列表 */}
        {isOpen && (
          <div className="px-4 py-2 space-y-2 border-t">
            {document.versions.map(version => {
              const isVerAssigned = isVersionAssigned(version.id);
              const isSelected = selectedVersionIds.includes(version.id);

              return (
                <div
                  key={version.id}
                  className={`flex items-center pl-6 py-1 rounded ${
                    isVerAssigned
                      ? 'bg-blue-50 dark:bg-blue-900/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Checkbox
                    id={`version-${version.id}`}
                    checked={isSelected}
                    onCheckedChange={checked => {
                      handleVersionSelectionChange(version.id, checked === true);
                    }}
                    disabled={disabled}
                    className="mr-2"
                  />
                  <Label
                    htmlFor={`version-${version.id}`}
                    className="flex items-center cursor-pointer flex-1"
                  >
                    <span className="mr-2">
                      {isVerAssigned ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                      ) : (
                        <Tag className="h-3.5 w-3.5 text-gray-400" />
                      )}
                    </span>
                    <span>
                      {version.name ||
                        t('KnowledgeBase.versionNumber', { number: version.version })}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(version.createdAt).toLocaleDateString()}
                    </span>

                    {isVerAssigned && (
                      <Badge className="ml-2 text-xs bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
                        {isSelected ? t('KnowledgeBase.keep') : t('KnowledgeBase.remove')}
                      </Badge>
                    )}

                    {!isVerAssigned && isSelected && (
                      <Badge className="ml-2 text-xs bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700">
                        {t('KnowledgeBase.add')}
                      </Badge>
                    )}
                  </Label>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-5 w-5 animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">{t('KnowledgeBase.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md">
        <p className="flex items-center">
          <Info className="mr-2 h-4 w-4" />
          {t('KnowledgeBase.loadError')}: {error}
        </p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
        <p className="flex items-center">
          <Info className="mr-2 h-4 w-4" />
          {t('KnowledgeBase.noDocuments')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-700 dark:text-gray-300 font-medium flex items-center">
          <CheckCircle2 className="h-4 w-4 text-blue-500 mr-1" />
          {t('KnowledgeBase.selectedVersions', { count: selectedVersionIds.length })}
        </div>

        {selectedVersionIds.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll} disabled={disabled}>
            <CircleMinus className="h-3.5 w-3.5 mr-1" />
            {t('KnowledgeBase.clearAll')}
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={v => setViewMode(v as ViewMode)}>
        <TabsList className="grid grid-cols-3 mb-2">
          <TabsTrigger value="all" className="text-sm">
            {t('KnowledgeBase.allDocuments')}
            <Badge variant="secondary" className="ml-2 text-xs">
              {documents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="assigned" className="text-sm">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mr-1" />
            {t('KnowledgeBase.assignedDocuments')}
            <Badge variant="secondary" className="ml-2 text-xs">
              {assignedDocuments.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="available" className="text-sm">
            <CirclePlus className="h-3.5 w-3.5 text-green-500 mr-1" />
            {t('KnowledgeBase.availableDocuments')}
            <Badge variant="secondary" className="ml-2 text-xs">
              {availableDocuments.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <div className="border rounded-md">
          <ScrollArea className="h-[300px]">
            <div className="p-2">{getFilteredDocuments().map(renderDocumentCard)}</div>
          </ScrollArea>
        </div>
      </Tabs>

      <div className="text-xs text-gray-500 italic">{t('KnowledgeBase.explainerText')}</div>
    </div>
  );
}
