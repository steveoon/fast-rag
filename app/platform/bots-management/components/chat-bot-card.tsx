/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { Bot, Copy, Edit, ExternalLink, Info, Power, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Chatbot } from '@/lib/db/schema/schema';

type ChatbotWithUrl = Chatbot & {
  fullUrl: string;
  client_tools_config?: any;
};

interface ChatBotCardProps {
  chatbot: ChatbotWithUrl;
  onEdit: (chatbot: ChatbotWithUrl) => void;
  onDelete: (chatbot: ChatbotWithUrl) => void;
  onToggleStatus: (chatbotId: string) => void;
  isUpdating: boolean;
}

export function ChatBotCard({
  chatbot,
  onEdit,
  onDelete,
  onToggleStatus,
  isUpdating,
}: ChatBotCardProps) {
  const t = useTranslations('Platform.BotsManagement');
  const { toast } = useToast();

  // 获取卡片的边框颜色类，根据状态动态设置
  const getCardBorderClass = (status: string) => {
    return status === 'active'
      ? 'border-t-blue-500 dark:border-t-blue-600'
      : 'border-t-gray-400 dark:border-t-gray-600';
  };

  const copyUrl = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    toast({
      title: t('copied'),
      description: t('urlCopiedDescription'),
    });
  };

  return (
    <Card
      className={cn(
        'border-0 border-t-2 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-gray-900 flex flex-col h-full',
        getCardBorderClass(chatbot.status),
        chatbot.status !== 'active' && 'opacity-85'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
              {chatbot.name}
              <Badge
                className={cn(
                  'ml-2 font-normal text-xs',
                  chatbot.status === 'active'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'
                )}
              >
                {chatbot.status === 'active' ? t('active') : t('disabled')}
              </Badge>
            </h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-3">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mb-4 min-h-[80px]">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {chatbot.description || t('noDescription')}
          </p>
        </div>

        <div className="border border-gray-100 dark:border-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <ExternalLink className="h-3.5 w-3.5 mr-1 text-gray-500" />
              {t('url')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={e => copyUrl(chatbot.fullUrl, e)}
              className="h-6 px-2 text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              {t('copyUrl')}
            </Button>
          </div>
          <ScrollArea className="h-9 w-full relative border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900 p-1.5">
            <p className="text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-nowrap">
              {chatbot.fullUrl}
            </p>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </CardContent>

      <CardFooter className="pt-2 flex justify-between mt-auto">
        <div className="flex items-center text-xs text-muted-foreground">
          <Info className="h-3 w-3 mr-1" />
          {new Date(chatbot.created_at).toLocaleDateString()}
        </div>

        <div className="flex space-x-1.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 px-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-800',
              chatbot.status === 'active'
                ? 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
                : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'
            )}
            onClick={e => {
              e.stopPropagation();
              onToggleStatus(chatbot.id);
            }}
            disabled={isUpdating}
          >
            <Power className="h-3 w-3 mr-1" />
            {chatbot.status === 'active' ? t('disable') : t('enable')}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30"
            onClick={e => {
              e.stopPropagation();
              onEdit(chatbot);
            }}
          >
            <Edit className="h-3 w-3 mr-1" />
            {t('edit')}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
            onClick={e => {
              e.stopPropagation();
              onDelete(chatbot);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
