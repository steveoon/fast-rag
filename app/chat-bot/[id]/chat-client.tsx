'use client';
import { FormEvent } from 'react';
import { Paperclip, Mic, CornerDownLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat-bubble';
import { ChatMessageList } from '@/components/ui/chat-message-list';
import { ChatInput } from '@/components/ui/chat-input';
import { useChat } from '@ai-sdk/react';

interface ChatClientProps {
  apiKey: string;
  tools: string[];
}

export function ChatClient({ apiKey, tools }: ChatClientProps) {
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: '/api/v1/chat',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: {
      tools,
    },
  });

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
  };

  const handleAttachFile = () => {
    //
  };

  const handleMicrophoneClick = () => {
    //
  };

  return (
    <div className="border bg-background rounded-lg flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        <ChatMessageList>
          {messages.map(message => (
            <ChatBubble key={message.id} variant={message.role === 'user' ? 'sent' : 'received'}>
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                src={
                  message.role === 'user'
                    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&crop=faces&fit=crop'
                    : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop'
                }
                fallback={message.role === 'user' ? 'US' : 'AI'}
              />
              <ChatBubbleMessage variant={message.role === 'user' ? 'sent' : 'received'}>
                {message.content}
              </ChatBubbleMessage>
            </ChatBubble>
          ))}

          {status === 'submitted' && (
            <ChatBubble variant="received">
              <ChatBubbleAvatar
                className="h-8 w-8 shrink-0"
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&crop=faces&fit=crop"
                fallback="AI"
              />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
        </ChatMessageList>
      </div>

      <div className="p-4 border-t">
        <form
          onSubmit={handleFormSubmit}
          className="relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring p-1"
        >
          <ChatInput
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="min-h-12 resize-none rounded-lg bg-background border-0 p-3 shadow-none focus-visible:ring-0"
          />
          <div className="flex items-center p-3 pt-0 justify-between">
            <div className="flex">
              <Button variant="ghost" size="icon" type="button" onClick={handleAttachFile}>
                <Paperclip className="size-4" />
              </Button>

              <Button variant="ghost" size="icon" type="button" onClick={handleMicrophoneClick}>
                <Mic className="size-4" />
              </Button>
            </div>
            <Button type="submit" size="sm" className="ml-auto gap-1.5">
              Send Message
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
