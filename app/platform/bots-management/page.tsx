import { createClient } from '@/lib/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getUserChatBots } from '@/lib/actions/get-user-chat-bots';
import { ActiveClientDisplay } from '@/components/ActiveClientDisplay';
import TranslationWrapper from '@/components/auth-translations';
import { Chatbot } from '@/lib/db/schema/schema';
import ChatBotsList from './components/chat-bots-list';
import { getToolsForActiveClient } from '@/lib/actions/get-client-tools-for-active-client';

// 扩展聊天机器人类型以包含工具配置
type ExtendedChatbot = Chatbot & {
  client_tools_config?: Array<{
    client_tool_id: string;
    tool_id: string;
    tool_name: string;
    config: Record<string, unknown>;
  }>;
};

export default async function BotsManagementPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/sign-in');
  }

  // 并行获取用户的聊天机器人和活跃客户端的工具
  const [chatBots, activeClientTools] = await Promise.all([
    getUserChatBots(user.id),
    getToolsForActiveClient(user.id),
  ]);

  return (
    <TranslationWrapper namespace="Platform.BotsManagement">
      {t => (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="pb-6 border-b">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold text-blue-900 dark:text-blue-300 mb-4">
                {t('title')}
              </h1>
              <ActiveClientDisplay />
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
          </div>
          <div className="py-6">
            <ChatBotsList
              initialChatBots={chatBots as ExtendedChatbot[]}
              userId={user.id}
              availableTools={activeClientTools.tools}
              hasActiveClient={activeClientTools.hasActiveClient}
            />
          </div>
        </div>
      )}
    </TranslationWrapper>
  );
}
