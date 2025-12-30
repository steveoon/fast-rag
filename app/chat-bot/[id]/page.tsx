import { headers } from 'next/headers';
import { getActiveKeyFromBotId } from '@/lib/actions/get-active-key-from-bot-id';
import { ChatClient } from './chat-client';
import { getBotTools } from '@/lib/actions/get-bot-tools';
import { getChatBotById } from '@/lib/actions/get-user-chat-bots';
import { getModelById } from '@/lib/actions/get-ai-models';
import { getBotKnowledgeBasesPublic } from '@/lib/actions/bot-knowledge-base';
import { AuroraBackground } from '@/components/aurora-background';
import { getTranslations } from 'next-intl/server';

export default async function ChatBotPage() {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname');
  const botId = pathname?.split('/chat-bot/')[1];

  // 获取国际化翻译
  const t = await getTranslations('ChatBot');

  if (!botId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
        <AuroraBackground variant="minimal" />
        <div className="p-8 text-center max-w-md mx-auto bg-white/70 dark:bg-gray-900/70 rounded-xl shadow-lg backdrop-blur-sm z-10">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
            {t('notFound')}
          </h2>
        </div>
      </div>
    );
  }

  try {
    // 获取聊天机器人信息并检查状态
    const chatBot = await getChatBotById(botId);

    if (!chatBot) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
          <AuroraBackground variant="minimal" />
          <div className="p-8 text-center max-w-md mx-auto bg-white/70 dark:bg-gray-900/70 rounded-xl shadow-lg backdrop-blur-sm z-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              {t('notFound')}
            </h2>
          </div>
        </div>
      );
    }

    // 检查机器人状态是否为启用状态
    if (chatBot.status !== 'active') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
          <AuroraBackground variant="minimal" />
          <div className="p-8 text-center max-w-md mx-auto bg-white/70 dark:bg-gray-900/70 rounded-xl shadow-lg backdrop-blur-sm z-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              {t('notActive')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-2">{t('adminDisabled')}</p>
            <p className="text-gray-600 dark:text-gray-400">{t('tryLater')}</p>
          </div>
        </div>
      );
    }

    const apiKey = await getActiveKeyFromBotId(botId);

    if (!apiKey) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
          <AuroraBackground variant="minimal" />
          <div className="p-8 text-center max-w-md mx-auto bg-white/70 dark:bg-gray-900/70 rounded-xl shadow-lg backdrop-blur-sm z-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              {t('noApiKey')}
            </h2>
          </div>
        </div>
      );
    }

    const tools = await getBotTools(botId);

    // 服务端获取知识库（不需要用户认证）
    const knowledgeBases = await getBotKnowledgeBasesPublic(botId);

    // 获取模型显示名称
    let modelDisplayName: string | undefined;
    if (chatBot.model_id) {
      const model = await getModelById(chatBot.model_id);
      modelDisplayName = model?.display_name || chatBot.model_id;
    }

    if (!tools || tools.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
          <AuroraBackground variant="minimal" />
          <div className="p-8 text-center max-w-md mx-auto bg-white/70 dark:bg-gray-900/70 rounded-xl shadow-lg backdrop-blur-sm z-10">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              {t('noTools')}
            </h2>
          </div>
        </div>
      );
    }

    const toolNames = tools.map(tool => tool.name);

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 p-2 sm:p-4 md:p-6">
        <AuroraBackground />
        <div className="w-full max-w-4xl h-[90vh] mx-auto bg-white/90 dark:bg-gray-900/90 rounded-xl shadow-xl backdrop-blur-sm z-10 overflow-hidden">
          <ChatClient
            apiKey={apiKey}
            tools={toolNames}
            botName={chatBot.name}
            botId={botId}
            modelId={chatBot.model_id || undefined}
            modelDisplayName={modelDisplayName}
            exampleQuestions={chatBot.example_questions as string[] | undefined}
            initialKnowledgeBases={knowledgeBases}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading chat bot:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
        <AuroraBackground variant="minimal" />
        <div className="p-8 text-center max-w-md mx-auto bg-white/70 dark:bg-gray-900/70 rounded-xl shadow-lg backdrop-blur-sm z-10">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">{t('error')}</h2>
        </div>
      </div>
    );
  }
}
