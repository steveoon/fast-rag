'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { Plus, RefreshCw, Bot } from 'lucide-react';
import ChatbotDialog from './chat-bot-dialog';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useClientToolsStore } from '@/components/tools/client-tools-store';
import { useChatBotsStore } from '../store';
import { useDialogManager } from '@/hooks/use-dialog-manager';
import { ChatBotCard } from './chat-bot-card';
import { Chatbot } from '@/lib/db/schema/schema';
export default function ChatBotsList({
  userId,
  initialChatBots = [],
}: {
  userId: string;
  initialChatBots: Chatbot[];
}) {
  // 使用store获取状态和方法，并用initialChatBots初始化
  const {
    chatbots,
    selectedChatbot,
    isUpdating,
    error,
    fetchChatBots,
    createChatBot,
    updateChatBot,
    toggleChatBotStatus,
    deleteChatBot,
    selectChatbot,
    setChatBots,
  } = useChatBotsStore();

  // 客户端工具store
  const { clientTools } = useClientToolsStore();

  // 对话框管理
  const { dialogs, openDialog, closeDialog } = useDialogManager();

  // 待删除的机器人
  const [chatbotToDelete, setChatbotToDelete] = useState<Chatbot | null>(null);

  const { toast } = useToast();
  const t = useTranslations('Platform.BotsManagement');
  const tUtils = useTranslations('Utils.Error');

  // 初始化store数据
  useEffect(() => {
    if (initialChatBots.length > 0) {
      setChatBots(
        initialChatBots.map(bot => ({
          ...bot,
          fullUrl: typeof window !== 'undefined' ? `${window.location.origin}${bot.url}` : '',
        }))
      );
    } else {
      fetchChatBots(userId);
    }
  }, [initialChatBots, setChatBots, fetchChatBots, userId]);

  // 从clientTools中提取工具信息的工具函数
  const getAvailableTools = useCallback(() => {
    return clientTools
      .filter(tool => tool.is_enabled)
      .map(tool => ({
        id: tool.id,
        toolId: tool.tool.id,
        name: tool.tool.name,
        client_id: tool.client_id,
        is_enabled: tool.is_enabled,
      }));
  }, [clientTools]);

  // 缓存计算结果
  const availableTools = useMemo(() => getAvailableTools(), [getAvailableTools]);
  const hasActiveClient = useMemo(() => clientTools.length > 0, [clientTools]);

  // 刷新数据的处理函数
  const handleRefresh = () => {
    fetchChatBots(userId);
  };

  // 处理创建提交
  const handleCreateSubmit = async (data: {
    name: string;
    description: string;
    clientToolIds: string[];
  }) => {
    try {
      await createChatBot(data, userId);
      closeDialog('create');
      toast({
        title: t('created'),
        description: t('agentCreatedDescription', { name: data.name }),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : tUtils('unknown'),
        variant: 'destructive',
      });
    }
  };

  // 处理更新提交
  const handleUpdateSubmit = async (data: {
    name: string;
    description: string;
    clientToolIds: string[];
  }) => {
    if (!selectedChatbot) return;

    try {
      // 检查是否有工具被过滤（通过比较原始工具ID和提交的工具ID）
      let originalToolIds: string[] = [];
      if (Array.isArray(selectedChatbot.client_tools_config)) {
        originalToolIds = selectedChatbot.client_tools_config.map(t => t.client_tool_id);
      } else if (typeof selectedChatbot.client_tools_config === 'string') {
        try {
          const toolsConfig = JSON.parse(selectedChatbot.client_tools_config);
          originalToolIds = toolsConfig.map((t: { client_tool_id: string }) => t.client_tool_id);
        } catch (e) {
          console.error('Error parsing client_tools_config:', e);
        }
      }

      const filteredOutCount =
        originalToolIds.length -
        originalToolIds.filter(id => data.clientToolIds.includes(id)).length;

      if (filteredOutCount > 0) {
        // 显示警告信息
        toast({
          title: t('toolsFilteredWarning'),
          description: t('toolsFilteredWarningDescription', { count: filteredOutCount }),
          variant: 'default',
        });
      }

      await updateChatBot(
        {
          id: selectedChatbot.id,
          ...data,
        },
        userId
      );

      closeDialog('edit');
      toast({
        title: t('updated'),
        description: t('agentUpdatedDescription', { name: data.name }),
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : tUtils('unknown'),
        variant: 'destructive',
      });
    }
  };

  // 处理状态切换
  const handleToggleStatus = async (chatbotId: string) => {
    try {
      await toggleChatBotStatus(chatbotId, userId);

      const chatbot = chatbots.find(bot => bot.id === chatbotId);
      if (chatbot) {
        const newStatus = chatbot.status === 'active' ? 'disabled' : 'active';
        toast({
          title: t('statusUpdated'),
          description:
            newStatus === 'active'
              ? t('agentEnabledDescription', { name: chatbot.name })
              : t('agentDisabledDescription', { name: chatbot.name }),
        });
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : tUtils('unknown'),
        variant: 'destructive',
      });
    }
  };

  // 处理删除
  const handleDelete = async () => {
    if (!chatbotToDelete) return;

    try {
      await deleteChatBot(chatbotToDelete.id, userId);
      closeDialog('delete');
      toast({
        title: t('deleted'),
        description: t('agentDeletedDescription', { name: chatbotToDelete.name }),
      });
      setChatbotToDelete(null);
    } catch (error) {
      toast({
        title: t('error'),
        description: error instanceof Error ? error.message : tUtils('unknown'),
        variant: 'destructive',
      });
    }
  };

  // 处理编辑点击
  const handleEditClick = (chatbot: Chatbot) => {
    selectChatbot(chatbot);
    openDialog('edit');
  };

  // 处理删除点击
  const handleDeleteClick = (chatbot: Chatbot) => {
    setChatbotToDelete(chatbot);
    openDialog('delete');
  };

  return (
    <div className="space-y-8">
      {/* 显示错误信息 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 列表头部 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => openDialog('create')}
            disabled={isUpdating}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('create')}
          </Button>

          <Button
            variant="outline"
            size="default"
            onClick={handleRefresh}
            disabled={isUpdating}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>

        <Badge variant="outline" className="px-2 text-blue-900 dark:text-blue-300">
          {t('totalChatBots', { count: chatbots.length })}
        </Badge>
      </div>

      {/* 创建对话框 */}
      <ChatbotDialog
        open={dialogs.create}
        onOpenChange={open => {
          if (!open) closeDialog('create');
          else openDialog('create');
        }}
        onSubmit={handleCreateSubmit}
        isSubmitting={isUpdating}
        availableTools={availableTools}
        hasActiveClient={hasActiveClient}
      />

      {/* 编辑对话框 */}
      <ChatbotDialog
        open={dialogs.edit}
        onOpenChange={open => {
          if (!open) {
            closeDialog('edit');
            selectChatbot(null);
          } else {
            openDialog('edit');
          }
        }}
        onSubmit={handleUpdateSubmit}
        isSubmitting={isUpdating}
        availableTools={availableTools}
        hasActiveClient={hasActiveClient}
        editChatbot={selectedChatbot}
      />

      {/* 机器人卡片列表 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {chatbots.map(chatbot => (
          <ChatBotCard
            key={chatbot.id}
            chatbot={chatbot}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onToggleStatus={handleToggleStatus}
            isUpdating={isUpdating}
          />
        ))}

        {/* 空状态显示 */}
        {!isUpdating && chatbots.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <Bot className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">{t('noChatBots')}</p>
            <Button variant="outline" className="mt-4" onClick={() => openDialog('create')}>
              <Plus className="h-4 w-4 mr-1" /> {t('createYourFirst')}
            </Button>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog
        open={dialogs.delete}
        onOpenChange={open => {
          if (!open) {
            closeDialog('delete');
            setChatbotToDelete(null);
          } else {
            openDialog('delete');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmation', { name: chatbotToDelete?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
