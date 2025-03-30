'use client';

import { useState, useEffect } from 'react';
import { ConfigurableCard } from '@/components/configurable-card';
import { createChatBot } from '@/lib/actions/create-chat-bot';
import { updateChatBotStatus } from '@/lib/actions/update-chat-bot-status';
import { deleteChatBot } from '@/lib/actions/delete-chat-bot';
import { updateChatBot } from '@/lib/actions/update-chat-bot';
import { getUserChatBots } from '@/lib/actions/get-user-chat-bots';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { Edit, Power, Copy, RefreshCw, Trash2, Plus } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
import { Chatbot } from '@/lib/db/schema/schema';
import { Button } from '@/components/ui/button';
import { ToolInfo } from '@/lib/actions/get-client-tools-for-active-client';

// 定义客户端工具配置类型
type ClientToolConfig = {
  client_tool_id: string;
  tool_id: string;
  tool_name: string;
  config: Record<string, unknown>;
};

// 扩展聊天机器人类型以包含工具配置
type ExtendedChatbot = Chatbot & {
  client_tools_config?: Array<ClientToolConfig> | string;
};

type ChatbotWithUrl = ExtendedChatbot & {
  fullUrl: string;
};

export default function ChatBotsList({
  initialChatBots,
  userId,
  availableTools = [],
  hasActiveClient = false,
}: {
  initialChatBots: ExtendedChatbot[];
  userId: string;
  availableTools?: ToolInfo[];
  hasActiveClient?: boolean;
}) {
  const [chatBots, setChatBots] = useState<ChatbotWithUrl[]>(
    initialChatBots.map(bot => ({
      ...bot,
      fullUrl: '', // 初始化为空字符串，避免服务器端渲染时使用window
    }))
  );
  const [isCreatingChatbot, setIsCreatingChatbot] = useState(false);
  const [isUpdatingChatbot, setIsUpdatingChatbot] = useState(false);
  const [loadingChatbotId, setLoadingChatbotId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatbotToDelete, setChatbotToDelete] = useState<Chatbot | null>(null);
  const [editChatbot, setEditChatbot] = useState<ExtendedChatbot | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { toast } = useToast();
  const t = useTranslations('Platform.BotsManagement');
  const tUtils = useTranslations('Utils.Error');

  // 在客户端渲染后设置完整URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setChatBots(prev =>
        prev.map(bot => ({
          ...bot,
          fullUrl: `${window.location.origin}${bot.url}`,
        }))
      );
    }
  }, [initialChatBots]);

  // 更新刷新机器人列表数据的函数，防止频繁请求
  const refreshChatBots = async () => {
    if (isRefreshing) return; // 防止重复请求

    try {
      setIsRefreshing(true);
      const refreshedChatBots = await getUserChatBots(userId);
      setChatBots(
        refreshedChatBots.map(bot => ({
          ...bot,
          fullUrl: typeof window !== 'undefined' ? `${window.location.origin}${bot.url}` : '',
        })) as ChatbotWithUrl[]
      );
      toast({
        title: t('refreshSuccess'),
        description: t('refreshSuccessDescription'),
      });
    } catch (error) {
      console.error('刷新聊天机器人列表失败:', error);
      toast({
        title: t('error'),
        description: tUtils('unknown'),
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateChatbot = async (data: {
    name: string;
    description: string;
    clientToolIds: string[];
  }) => {
    setIsCreatingChatbot(true);
    try {
      const result = await createChatBot({
        name: data.name,
        description: data.description,
        clientToolIds: data.clientToolIds,
        userId,
      });

      // 创建成功后刷新数据
      await refreshChatBots();

      toast({
        title: t('created'),
        description: t('chatbotCreatedDescription', { name: result.chatbot.name }),
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          title: t('error'),
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('error'),
          description: tUtils('unknown'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsCreatingChatbot(false);
    }
  };

  const handleUpdateChatbot = async (data: {
    name: string;
    description: string;
    clientToolIds: string[];
  }) => {
    if (!editChatbot) return;

    setIsUpdatingChatbot(true);
    try {
      const result = await updateChatBot({
        id: editChatbot.id,
        name: data.name,
        description: data.description,
        clientToolIds: data.clientToolIds,
        userId,
      });

      // 更新成功后刷新数据
      await refreshChatBots();

      toast({
        title: t('updated'),
        description: t('chatbotUpdatedDescription', { name: result.chatbot.name }),
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          title: t('error'),
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('error'),
          description: tUtils('unknown'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsUpdatingChatbot(false);
      setEditChatbot(null);
    }
  };

  const handleToggleStatus = async (chatbotId: string) => {
    setLoadingChatbotId(chatbotId);
    try {
      const chatbot = chatBots.find(bot => bot.id === chatbotId);
      if (!chatbot) return;

      const newStatus = chatbot.status === 'active' ? 'disabled' : 'active';
      await updateChatBotStatus(chatbotId, newStatus, userId);

      setChatBots(
        chatBots.map(bot => (bot.id === chatbotId ? { ...bot, status: newStatus } : bot))
      );

      toast({
        title: t('statusUpdated'),
        description:
          newStatus === 'active'
            ? t('chatbotEnabledDescription', { name: chatbot.name })
            : t('chatbotDisabledDescription', { name: chatbot.name }),
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          title: t('error'),
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('error'),
          description: tUtils('unknown'),
          variant: 'destructive',
        });
      }
    } finally {
      setLoadingChatbotId(null);
    }
  };

  const handleDelete = async () => {
    if (!chatbotToDelete) return;

    try {
      await deleteChatBot(chatbotToDelete.id, userId);

      setChatBots(chatBots.filter(bot => bot.id !== chatbotToDelete.id));

      toast({
        title: t('deleted'),
        description: t('chatbotDeletedDescription', { name: chatbotToDelete.name }),
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          title: t('error'),
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('error'),
          description: tUtils('unknown'),
          variant: 'destructive',
        });
      }
    } finally {
      setDeleteDialogOpen(false);
      setChatbotToDelete(null);
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: t('copied'),
      description: t('urlCopiedDescription'),
    });
  };

  // 点击编辑按钮时设置编辑对象并打开对话框
  const handleEditClick = (chatbot: ExtendedChatbot) => {
    setEditChatbot(chatbot);
    setEditDialogOpen(true);
  };

  // 编辑对话框关闭时清空编辑对象
  const handleEditDialogOpenChange = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setEditChatbot(null);
    }
  };

  const openDeleteDialog = (chatbot: Chatbot) => {
    setChatbotToDelete(chatbot);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setCreateDialogOpen(true)}
            disabled={isCreatingChatbot}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('create')}
          </Button>

          <Button
            variant="outline"
            size="default"
            onClick={refreshChatBots}
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>

        <Badge variant="outline" className="px-2 text-blue-900 dark:text-blue-300">
          {t('totalChatBots', { count: chatBots.length })}
        </Badge>
      </div>

      <ChatbotDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateChatbot}
        isSubmitting={isCreatingChatbot}
        availableTools={availableTools}
        hasActiveClient={hasActiveClient}
      />

      <ChatbotDialog
        open={editDialogOpen}
        onOpenChange={handleEditDialogOpenChange}
        onSubmit={handleUpdateChatbot}
        isSubmitting={isUpdatingChatbot}
        availableTools={availableTools}
        hasActiveClient={hasActiveClient}
        editChatbot={editChatbot}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {chatBots.map(chatbot => (
          <ConfigurableCard
            key={chatbot.id}
            icon={Power}
            title={chatbot.name}
            content={
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {chatbot.description || t('noDescription')}
                </p>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {t('status')}:{' '}
                  <span
                    className={`font-semibold ${chatbot.status === 'active' ? 'text-green-500' : 'text-gray-400'}`}
                  >
                    {chatbot.status === 'active' ? t('active') : t('disabled')}
                  </span>
                </p>
                <div className="text-gray-600 dark:text-gray-400">
                  <div className="mb-1 flex items-center justify-between">
                    <div>{t('url')}:</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyUrl(chatbot.fullUrl)}
                      className="h-6 px-2 text-xs"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      {t('copyUrl')}
                    </Button>
                  </div>
                  <ScrollArea className="w-full h-10 relative pr-20">
                    <div className="w-full h-10 flex items-center">
                      <code className="text-xs">{chatbot.fullUrl}</code>
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
              </>
            }
            primaryAction={{
              label: chatbot.status === 'active' ? t('disable') : t('enable'),
              onClick: () => handleToggleStatus(chatbot.id),
              icon: Power,
              loading: loadingChatbotId === chatbot.id,
              variant: chatbot.status === 'active' ? 'danger' : 'success',
            }}
            secondaryAction={{
              label: t('edit'),
              onClick: () => handleEditClick(chatbot),
              icon: Edit,
            }}
            dangerAction={{
              label: t('delete'),
              onClick: () => openDeleteDialog(chatbot),
              icon: Trash2,
            }}
          />
        ))}

        {chatBots.length === 0 && (
          <div className="col-span-3 text-center py-10 text-gray-500">{t('noChatBots')}</div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmation', { name: chatbotToDelete?.name })}
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
