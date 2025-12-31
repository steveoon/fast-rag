'use client';
import { FormEvent, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Paperclip,
  Mic,
  CornerDownLeft,
  AlertCircle,
  Bot,
  User,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat-bubble';
import { ChatMessageList } from '@/components/ui/chat-message-list';
import { ChatInput } from '@/components/ui/chat-input';
import { ChatWelcome } from '@/components/ui/chat-welcome';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useTranslations } from 'next-intl';
import { ChatBotToolStatus } from './components/chat-bot-tool-status';
import { MessageContentAdapter } from '@/hooks/message-content-adapter';
import {
  useKnowledgeBaseStore,
  type AssignedKnowledgeBase,
} from '@/app/platform/bots-management/store/knowledge-base-store';
import { cn } from '@/lib/utils';
import type { UIMessage } from '@ai-sdk/react';
import type { ChatUIMessage, ProcessingStatusDataPart } from '@/lib/types/ui-message';

// 从消息 parts 中提取纯文本内容用于复制
function extractTextFromMessage(message: UIMessage): string {
  if (!message.parts || message.parts.length === 0) {
    return '';
  }

  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map(part => part.text)
    .join('\n');
}

interface ChatClientProps {
  apiKey: string;
  tools: string[];
  botName?: string;
  botId?: string;
  modelId?: string;
  modelDisplayName?: string;
  exampleQuestions?: string[];
  initialKnowledgeBases?: AssignedKnowledgeBase[];
  initialBotDisabled?: boolean;
}

// 内部聊天组件，接收已加载的知识库数据
interface ChatCoreProps {
  apiKey: string;
  tools: string[];
  botName: string;
  botId: string;
  modelId?: string;
  modelDisplayName?: string;
  exampleQuestions?: string[];
  assignedKnowledgeBases: AssignedKnowledgeBase[];
  initialBotDisabled?: boolean;
}

function ChatCore({
  apiKey,
  tools,
  botName,
  botId,
  modelId,
  modelDisplayName,
  exampleQuestions,
  assignedKnowledgeBases,
  initialBotDisabled = false,
}: ChatCoreProps) {
  const [chatError, setChatError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isBotDisabled, setIsBotDisabled] = useState(initialBotDisabled);
  // 处理状态 - 用于显示实时处理进度
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusDataPart | null>(null);
  const t = useTranslations('ChatBot.chat');

  // Bot 状态轮询检查（每 30 秒）
  const checkBotStatus = useCallback(async () => {
    if (!botId || !apiKey) return;

    try {
      const response = await fetch(`/api/v1/bot-status/${botId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await response.json();

      if (!response.ok || !data.data?.isActive) {
        setIsBotDisabled(true);
      } else {
        // Bot 重新启用时恢复状态
        setIsBotDisabled(false);
      }
    } catch (error) {
      console.error('Bot status check failed:', error);
    }
  }, [botId, apiKey]);

  useEffect(() => {
    if (!botId) return;

    // 初始检查
    checkBotStatus();

    // 设置轮询（30 秒间隔）
    const intervalId = setInterval(checkBotStatus, 30000);

    return () => clearInterval(intervalId);
  }, [botId, checkBotStatus]);

  // 创建 transport，此时知识库已经加载完成
  const transport = useMemo(() => {
    const docs = assignedKnowledgeBases.map(kb => kb.documentId);
    const docVersions = assignedKnowledgeBases.map(kb => kb.documentVersionId);
    console.log('创建 ChatTransport，知识库数量:', assignedKnowledgeBases.length, 'docs:', docs);
    return new DefaultChatTransport({
      api: '/api/v1/chat',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: {
        botId: botId || undefined, // 传递 botId 用于状态验证
        enabledTools: tools,
        maxSteps: 15,
        docs,
        docVersions,
        model: modelId,
      },
    });
  }, [apiKey, tools, assignedKnowledgeBases, modelId, botId]);

  const { messages, sendMessage, status } = useChat<ChatUIMessage>({
    onError: error => {
      console.error('Chat error:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Error details:', error);
      }
      setChatError(t('serviceUnavailable'));
    },
    // 处理流式数据部分 (包括临时数据)
    onData: dataPart => {
      // 处理临时的处理状态通知
      if (dataPart.type === 'data-processingStatus') {
        const statusData = dataPart.data as ProcessingStatusDataPart;
        setProcessingStatus(statusData);
        // 处理完成时清除状态
        if (statusData.status === 'completed') {
          setTimeout(() => setProcessingStatus(null), 500);
        }
      }
      // 处理临时通知 (可扩展为 toast 等)
      if (dataPart.type === 'data-notification') {
        console.log('Notification:', dataPart.data);
      }
    },
    transport,
  });

  // 判断是否在加载中（submitted或streaming状态）
  const isProcessing = status === 'submitted' || status === 'streaming';

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setChatError(null);
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  const handleAttachFile = () => {
    alert(t('fileUploadDeveloping'));
  };

  const handleMicrophoneClick = () => {
    alert(t('voiceInputDeveloping'));
  };

  // 处理键盘事件：按 Enter 发送，Shift+Enter 换行
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isProcessing) {
        setChatError(null);
        sendMessage({ text: input });
        setInput('');
      }
    }
  };

  // 处理建议问题点击
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  // Bot 被禁用时显示提示
  if (isBotDisabled) {
    return (
      <div className="flex flex-col h-full bg-background/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl">
        {/* 标题栏 */}
        <div className="py-4 px-5 border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-md flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            {/* 离线状态指示器 */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-400 rounded-full border-2 border-white dark:border-gray-900" />
          </div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{botName}</h2>
        </div>

        {/* 禁用提示 */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              {t('botDisabledTitle') || '聊天机器人已停用'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {t('botDisabledDescription') ||
                '管理员暂时关闭了此聊天助手的访问权限，请稍后再试或联系管理员。'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl">
      {/* 标题栏 */}
      <div className="py-4 px-5 border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Bot 头像 */}
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            {/* 在线状态指示器 */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
          </div>

          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{botName}</h2>
            {modelDisplayName && (
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {modelDisplayName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {chatError && (
        <div
          className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 px-4 py-3 mx-4 mt-4 rounded-r-lg"
          role="alert"
        >
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
            <span className="text-sm">{chatError}</span>
          </div>
        </div>
      )}

      {/* 消息区域 */}
      <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50/50 to-white dark:from-gray-900 dark:to-gray-800">
        <ChatMessageList className="px-4 py-6">
          {/* 空状态 - 欢迎页面 */}
          {messages.length === 0 && status !== 'submitted' && (
            <ChatWelcome
              botName={botName}
              exampleQuestions={exampleQuestions}
              onSuggestionClick={handleSuggestionClick}
            />
          )}

          {/* 消息列表 */}
          {messages.map(message => (
            <ChatBubble key={message.id} variant={message.role === 'user' ? 'sent' : 'received'}>
              <ChatBubbleAvatar
                variant={message.role === 'user' ? 'user' : 'assistant'}
                icon={
                  message.role === 'user' ? (
                    <User className="h-4.5 w-4.5 text-white" />
                  ) : (
                    <Bot className="h-4.5 w-4.5 text-gray-600 dark:text-gray-300" />
                  )
                }
              />
              <ChatBubbleMessage
                variant={message.role === 'user' ? 'sent' : 'received'}
                copyContent={extractTextFromMessage(message)}
              >
                <MessageContentAdapter
                  key={message.id}
                  content={message.parts ?? []}
                  showCopyButton={false}
                  showOnly={['text', 'reasoning', 'tool', 'source']}
                  messageId={message.id}
                />

                {message.role === 'assistant' &&
                  message === messages[messages.length - 1] &&
                  isProcessing && (
                    <div className="mt-2 pt-2 border-t border-gray-200/50 dark:border-gray-600/30">
                      <ChatBotToolStatus
                        processingStatus={processingStatus}
                        isProcessing={isProcessing}
                      />
                    </div>
                  )}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}

          {/* 初始加载状态 */}
          {status === 'submitted' && messages.length === 0 && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar
                variant="assistant"
                icon={<Bot className="h-4.5 w-4.5 text-gray-600 dark:text-gray-300" />}
              />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}

          {messages.length === 0 && status === 'submitted' && (
            <ChatBotToolStatus processingStatus={processingStatus} isProcessing={isProcessing} />
          )}
        </ChatMessageList>
      </div>

      {/* 输入区域 */}
      <div className="p-4 border-t bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
        <form
          onSubmit={handleFormSubmit}
          className={cn(
            'relative rounded-2xl',
            'bg-white dark:bg-gray-800',
            'border-2 border-gray-200 dark:border-gray-700',
            'shadow-lg shadow-gray-200/50 dark:shadow-black/20',
            'focus-within:border-blue-400 dark:focus-within:border-blue-500',
            'focus-within:shadow-blue-500/10',
            'focus-within:ring-4 focus-within:ring-blue-500/10',
            'transition-all duration-200',
            'overflow-hidden'
          )}
        >
          <ChatInput
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('inputPlaceholder')}
            className={cn(
              'min-h-[52px] max-h-32 resize-none',
              'px-4 py-3.5',
              'bg-transparent border-0',
              'text-gray-800 dark:text-gray-100',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'focus-visible:ring-0 focus-visible:outline-none'
            )}
            disabled={isProcessing}
          />

          {/* 底部工具栏 */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleAttachFile}
                disabled={isProcessing}
                title={t('attachFile')}
                className={cn(
                  'h-8 w-8 rounded-lg',
                  'text-gray-500 hover:text-gray-700',
                  'dark:text-gray-400 dark:hover:text-gray-200',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'transition-colors'
                )}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleMicrophoneClick}
                disabled={isProcessing}
                title={t('voiceInput')}
                className={cn(
                  'h-8 w-8 rounded-lg',
                  'text-gray-500 hover:text-gray-700',
                  'dark:text-gray-400 dark:hover:text-gray-200',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  'transition-colors'
                )}
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>

            {/* 发送按钮 */}
            <Button
              type="submit"
              size="sm"
              disabled={isProcessing || !input.trim()}
              className={cn(
                'h-9 px-4 rounded-xl',
                'bg-gradient-to-r from-blue-500 to-blue-600',
                'hover:from-blue-600 hover:to-blue-700',
                'text-white font-medium',
                'shadow-md shadow-blue-500/25',
                'hover:shadow-lg hover:shadow-blue-500/30',
                'disabled:opacity-50 disabled:shadow-none',
                'transition-all duration-200',
                'flex items-center gap-2'
              )}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>{t('sendMessage')}</span>
                  <CornerDownLeft className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 外部包装组件，负责加载知识库并在就绪后渲染 ChatCore
export function ChatClient({
  apiKey,
  tools,
  botName = 'AI Assistant',
  botId,
  modelId,
  modelDisplayName,
  exampleQuestions,
  initialKnowledgeBases,
  initialBotDisabled = false,
}: ChatClientProps) {
  const [knowledgeBaseReady, setKnowledgeBaseReady] = useState(!!initialKnowledgeBases);
  const { assignedKnowledgeBases, fetchBotKnowledgeBases } = useKnowledgeBaseStore();
  const t = useTranslations('ChatBot.chat');

  // 如果服务端已提供知识库数据，直接使用；否则从客户端获取（仅用于后台管理页面）
  const effectiveKnowledgeBases = initialKnowledgeBases ?? assignedKnowledgeBases;

  useEffect(() => {
    // 如果已有服务端提供的知识库数据，跳过客户端获取
    if (initialKnowledgeBases) {
      setKnowledgeBaseReady(true);
      return;
    }

    // 回退逻辑：当没有服务端数据时尝试客户端获取（需要用户认证，可能失败）
    if (botId) {
      setKnowledgeBaseReady(false);
      fetchBotKnowledgeBases(botId)
        .then(() => {
          setKnowledgeBaseReady(true);
        })
        .catch(error => {
          console.error('获取机器人知识库失败:', error);
          setKnowledgeBaseReady(true);
        });
    } else {
      setKnowledgeBaseReady(true);
    }
  }, [botId, fetchBotKnowledgeBases, initialKnowledgeBases]);

  // 生成用于强制重新创建 ChatCore 的 key
  const chatKey = useMemo(() => {
    const docs = effectiveKnowledgeBases.map(kb => kb.documentId);
    return `chat-${botId}-${docs.join(',')}-${knowledgeBaseReady}`;
  }, [botId, effectiveKnowledgeBases, knowledgeBaseReady]);

  // 知识库加载中显示加载状态
  if (!knowledgeBaseReady) {
    return (
      <div className="flex flex-col h-full bg-background/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl">
        <div className="py-4 px-5 border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{botName}</h2>
        </div>
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50/50 to-white dark:from-gray-900 dark:to-gray-800">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <div className="relative">
              <div className="absolute inset-0 blur-2xl opacity-30 bg-blue-400 rounded-full scale-150 animate-pulse" />
              <Loader2 className="h-10 w-10 animate-spin text-blue-500 relative" />
            </div>
            <span className="text-sm">{t('loadingKnowledgeBase') || '正在加载知识库...'}</span>
          </div>
        </div>
      </div>
    );
  }

  // 使用 key 强制在知识库变化时重新创建 ChatCore
  return (
    <ChatCore
      key={chatKey}
      apiKey={apiKey}
      tools={tools}
      botName={botName}
      botId={botId || ''}
      modelId={modelId}
      modelDisplayName={modelDisplayName}
      exampleQuestions={exampleQuestions}
      assignedKnowledgeBases={effectiveKnowledgeBases}
      initialBotDisabled={initialBotDisabled}
    />
  );
}
