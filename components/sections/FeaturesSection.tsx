import { Brain, Database, Wrench } from 'lucide-react';
import { FeatureCard } from '@/components/ui/FeatureCard';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { useTranslations } from 'next-intl';

export function FeaturesSection() {
  const t = useTranslations('home.features');

  // JSON 请求和响应示例
  const requestJson = `{
  "messages": [
    {
      "content": "苏州的天气如何?",
      "role": "user"
    }
  ],
  "enabledTools": [
    "weather",
    "knowledgeBase",
    "webSearch",
    "smartWikidata",
    "..."
  ]
}`;

  const responseJson = `{
  "messages": [
    {"type": "text", "text": "PROCESS START"}
  ],
  "toolCalls": [
    {
      "toolCallId": "call_rIwB5vBFx85VsZyB7EONju3G",
      "toolName": "getWeather",
      "args": {"city": "Suzhou"}
    }
  ],
  // 系统自动选择合适工具并执行
  "response": "苏州今天天气晴朗，当前温度21.7°C..."
}`;

  return (
    <section id="features" className="container px-4 py-24 mx-auto relative">
      <div className="text-center max-w-3xl mx-auto mb-16 relative">
        <span className="inline-block mb-2 text-sm font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full">
          {t('sectionTag')}
        </span>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-900 dark:text-white relative">
          {t('title')}
        </h2>
        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-indigo-500 dark:via-indigo-400 to-transparent mx-auto mb-6"></div>
      </div>
      <div className="grid md:grid-cols-3 gap-8 mb-20">
        <FeatureCard
          icon={<Brain className="w-6 h-6 text-indigo-500 dark:text-indigo-300" />}
          title={t('cards.autonomy.title')}
          description={t('cards.autonomy.description')}
        />
        <FeatureCard
          icon={<Database className="w-6 h-6 text-indigo-500 dark:text-indigo-300" />}
          title={t('cards.knowledge.title')}
          description={t('cards.knowledge.description')}
        />
        <FeatureCard
          icon={<Wrench className="w-6 h-6 text-indigo-500 dark:text-indigo-300" />}
          title={t('cards.developer.title')}
          description={t('cards.developer.description')}
        />
      </div>

      {/* API 示例部分 */}
      <div className="relative">
        <div className="absolute -left-40 top-10 w-80 h-80 bg-blue-300 dark:bg-blue-500 rounded-full opacity-20 dark:opacity-10 blur-3xl animate-aurora-slow"></div>
        <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-indigo-100 dark:border-indigo-800 rounded-xl shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-900/30 overflow-hidden max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-700 dark:to-indigo-600 py-3 px-4 text-white font-medium flex items-center">
            <div className="flex gap-2 mr-auto">
              <div className="h-3 w-3 rounded-full bg-red-400"></div>
              <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
              <div className="h-3 w-3 rounded-full bg-green-400"></div>
            </div>
            <div className="flex items-center">
              <span className="mr-2">{t('api.title')}</span>
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded">{t('api.endpoint')}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 divide-x divide-indigo-100 dark:divide-indigo-800">
            {/* 请求部分 */}
            <div className="p-5">
              <div className="text-indigo-800 dark:text-indigo-300 font-semibold mb-2 flex items-center">
                <span className="bg-indigo-100 dark:bg-indigo-800/70 text-indigo-600 dark:text-indigo-300 text-xs px-2 py-0.5 rounded mr-2">
                  {t('api.requestLabel')}
                </span>
                {t('api.requestTitle')}
              </div>
              <CodeBlock code={requestJson} language="json" fileName="request.json" />
              <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">
                {t('api.requestHint')}
              </p>
            </div>

            {/* 响应部分 */}
            <div className="p-5">
              <div className="text-indigo-800 dark:text-indigo-300 font-semibold mb-2 flex items-center">
                <span className="bg-green-100 dark:bg-green-900/70 text-green-600 dark:text-green-300 text-xs px-2 py-0.5 rounded mr-2">
                  {t('api.responseLabel')}
                </span>
                {t('api.responseTitle')}
              </div>
              <CodeBlock code={responseJson} language="json" fileName="response.json" />
              <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">
                {t('api.responseHint')}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950 dark:to-gray-900 p-4 border-t border-indigo-100 dark:border-indigo-800">
            <p className="text-center text-indigo-800 dark:text-indigo-300">
              <span className="font-semibold">{t('api.bottomText1')}</span> —{t('api.bottomText2')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
