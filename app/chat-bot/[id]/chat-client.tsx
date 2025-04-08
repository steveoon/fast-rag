'use client';
import { FormEvent, useState } from 'react';
import { Paperclip, Mic, CornerDownLeft, AlertCircle, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat-bubble';
import { ChatMessageList } from '@/components/ui/chat-message-list';
import { ChatInput } from '@/components/ui/chat-input';
import { useChat } from '@ai-sdk/react';
import { useTranslations } from 'next-intl';
import { ChatBotToolStatus } from './components/chat-bot-tool-status';
import { MessageContentAdapter } from '@/hooks/message-content-adapter';

interface ChatClientProps {
  apiKey: string;
  tools: string[];
  botName?: string;
}

export function ChatClient({ apiKey, tools, botName = 'AI Assistant' }: ChatClientProps) {
  const [chatError, setChatError] = useState<string | null>(null);
  const t = useTranslations('ChatBot.chat');

  const { messages, input, handleInputChange, handleSubmit, status, data } = useChat({
    api: '/api/v1/chat',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: {
      enabledTools: tools,
      model: 'anthropic/claude-3.7-sonnet',
      maxSteps: 6,
    },
    onError: error => {
      console.error('Chat error:', error);
      setChatError(t('serviceUnavailable'));
    },
  });

  // 判断是否在加载中（submitted或streaming状态）
  const isProcessing = status === 'submitted' || status === 'streaming';

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setChatError(null);
    if (!input.trim()) return;
    handleSubmit(e);
  };

  const handleAttachFile = () => {
    // 文件上传功能
    alert(t('fileUploadDeveloping'));
  };

  const handleMicrophoneClick = () => {
    // 语音输入功能
    alert(t('voiceInputDeveloping'));
  };

  return (
    <div className="flex flex-col h-full bg-background/80 backdrop-blur-sm rounded-lg overflow-hidden">
      {/* 标题栏 */}
      <div className="py-3 px-4 border-b bg-white/90 dark:bg-gray-800/90 flex items-center justify-center shadow-sm">
        <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">{botName}</h2>
      </div>

      {chatError && (
        <div
          className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 m-2 rounded"
          role="alert"
        >
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>{chatError}</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <ChatMessageList className="px-4 py-6">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t('newConversation')}
            </div>
          )}

          {messages.map(message => (
            <ChatBubble key={message.id} variant={message.role === 'user' ? 'sent' : 'received'}>
              <div className="relative">
                <ChatBubbleAvatar
                  className={`h-8 w-8 shrink-0 ${message.role === 'user' ? 'bg-blue-500 dark:bg-blue-600' : 'bg-gray-500 dark:bg-gray-600'}`}
                  fallback={message.role === 'user' ? 'U' : 'A'}
                />
                {message.role === 'user' ? (
                  <User className="h-4 w-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                ) : (
                  <Bot className="h-4 w-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                )}
              </div>
              <ChatBubbleMessage
                variant={message.role === 'user' ? 'sent' : 'received'}
                className={
                  message.role === 'user'
                    ? 'bg-blue-500 text-white dark:bg-blue-600'
                    : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }
              >
                {/* 使用MessageContentAdapter处理所有内容 */}
                {Array.isArray(message.parts) ? (
                  <MessageContentAdapter
                    key={`${message.id}-${JSON.stringify(message.parts).length}`}
                    content={message.parts.filter(
                      part =>
                        part.type === 'text' ||
                        part.type === 'tool-invocation' ||
                        part.type === 'reasoning' ||
                        part.type === 'source' ||
                        part.type === 'file'
                    )}
                    showCopyButton={message.role !== 'user'}
                    showOnly={['text', 'reasoning', 'tool-invocation', 'source']}
                  />
                ) : (
                  <MessageContentAdapter
                    key={`${message.id}-${message.content?.length || 0}`}
                    content={message.content}
                    showCopyButton={message.role !== 'user'}
                  />
                )}

                {/* 如果是最后一条AI消息且正在处理中，显示工具状态 */}
                {message.role === 'assistant' &&
                  message === messages[messages.length - 1] &&
                  isProcessing && (
                    <div className="mt-2 pt-2 border-t border-gray-300/30 dark:border-gray-600/30">
                      <ChatBotToolStatus data={data} isProcessing={isProcessing} />
                    </div>
                  )}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}

          {/* 仅在初始加载时显示加载气泡（没有工具状态数据） */}
          {status === 'submitted' && (!data || data.length === 0) && (
            <ChatBubble variant="received">
              <div className="relative">
                <ChatBubbleAvatar
                  className="h-8 w-8 shrink-0 bg-gray-500 dark:bg-gray-600"
                  fallback="A"
                />
                <Bot className="h-4 w-4 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <ChatBubbleMessage isLoading className="bg-gray-200 dark:bg-gray-700" />
            </ChatBubble>
          )}

          {/* 工具状态指示器（仅在没有消息时显示） */}
          {messages.length === 0 && status === 'submitted' && (
            <ChatBotToolStatus data={data} isProcessing={isProcessing} />
          )}
        </ChatMessageList>
      </div>

      <div className="p-4 border-t bg-white/90 dark:bg-gray-800/90">
        <form
          onSubmit={handleFormSubmit}
          className="relative rounded-lg border bg-white dark:bg-gray-900 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 p-1"
        >
          <ChatInput
            value={input}
            onChange={handleInputChange}
            placeholder={t('inputPlaceholder')}
            className="min-h-12 resize-none rounded-lg bg-transparent border-0 p-3 shadow-none focus-visible:ring-0"
            disabled={isProcessing}
          />
          <div className="flex items-center p-3 pt-0 justify-between">
            <div className="flex">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleAttachFile}
                disabled={isProcessing}
                title={t('attachFile')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <Paperclip className="size-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={handleMicrophoneClick}
                disabled={isProcessing}
                title={t('voiceInput')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <Mic className="size-4" />
              </Button>
            </div>
            <Button
              type="submit"
              size="sm"
              className="ml-auto gap-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
              disabled={isProcessing || !input.trim()}
            >
              {t('sendMessage')}
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
