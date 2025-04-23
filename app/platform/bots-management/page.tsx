import { createClient } from '@/lib/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { ActiveClientDisplay } from '@/components/active-client-display';
import TranslationWrapper from '@/components/auth-translations';
import ChatBotsList from './components/chat-bots-list';
import ClientToolsProvider from './components/client-tools-provider';
import { getUserChatBots } from '@/lib/actions/get-user-chat-bots';

export default async function BotsManagementPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/sign-in');
  }

  // 预获取聊天机器人数据，确保加载状态能正确显示
  // 这会触发 loading.tsx 的显示
  const initialChatBots = await getUserChatBots(user.id);

  return (
    <TranslationWrapper namespace="Platform.BotsManagement">
      {t => (
        <ClientToolsProvider>
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
              <Suspense fallback={null}>
                <ChatBotsList userId={user.id} initialChatBots={initialChatBots} />
              </Suspense>
            </div>
          </div>
        </ClientToolsProvider>
      )}
    </TranslationWrapper>
  );
}
