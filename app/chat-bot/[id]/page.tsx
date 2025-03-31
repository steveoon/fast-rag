import { headers } from 'next/headers';
import { getActiveKeyFromBotId } from '@/lib/actions/get-active-key-from-bot-id';
import { ChatClient } from './chat-client';
import { getBotTools } from '@/lib/actions/get-bot-tools';

export default async function ChatBotPage() {
  const headersList = headers();
  const pathname = headersList.get('x-pathname');
  const botId = pathname?.split('/chat-bot/')[1];

  if (!botId) {
    return <div>Bot ID not found</div>;
  }

  const apiKey = await getActiveKeyFromBotId(botId);

  if (!apiKey) {
    return <div>API Key not found</div>;
  }

  const tools = await getBotTools(botId);
  const toolNames = tools.map(tool => tool.name);
  console.log(toolNames, '******');
  return <ChatClient apiKey={apiKey} tools={toolNames} />;
}
