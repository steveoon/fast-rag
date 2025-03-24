import { BarChart4, GavelIcon, Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function UseCasesSection() {
  const t = useTranslations('home.useCases');

  return (
    <section id="cases" className="container px-4 py-24 mx-auto relative">
      <div className="absolute -left-40 top-60 w-96 h-96 bg-pink-300 dark:bg-pink-500 rounded-full opacity-20 dark:opacity-10 blur-3xl animate-aurora-medium"></div>
      <div className="text-center max-w-3xl mx-auto mb-16 relative">
        <span className="inline-block mb-2 text-sm font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full">
          {t('sectionTag')}
        </span>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-900 dark:text-white">
          {t('title')}
        </h2>
        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-indigo-500 dark:via-indigo-400 to-transparent mx-auto mb-6"></div>
        <p className="text-lg text-indigo-700 dark:text-indigo-300 max-w-3xl mx-auto relative">
          {t('description')}
        </p>
      </div>
      <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 relative">
        {/* 装饰连接线 */}
        <div className="hidden lg:block absolute top-1/2 left-1/3 w-1/6 h-0.5 bg-gradient-to-r from-transparent via-indigo-200 dark:via-indigo-700 to-transparent"></div>
        <div className="hidden lg:block absolute top-1/2 right-1/3 w-1/6 h-0.5 bg-gradient-to-r from-transparent via-indigo-200 dark:via-indigo-700 to-transparent"></div>

        <IndustryCard
          icon={<BarChart4 className="w-5 h-5 text-indigo-500 dark:text-indigo-300" />}
          title={t('cases.finance.title')}
          description={t('cases.finance.description')}
        />
        <IndustryCard
          icon={<GavelIcon className="w-5 h-5 text-indigo-500 dark:text-indigo-300" />}
          title={t('cases.legal.title')}
          description={t('cases.legal.description')}
        />
        <IndustryCard
          icon={<Activity className="w-5 h-5 text-indigo-500 dark:text-indigo-300" />}
          title={t('cases.healthcare.title')}
          description={t('cases.healthcare.description')}
        />
      </div>
    </section>
  );
}

// 行业场景卡片组件
function IndustryCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative backdrop-blur-sm bg-gradient-to-br from-white/90 via-white/80 to-indigo-50/60 dark:from-gray-900/90 dark:via-gray-800/80 dark:to-indigo-950/60 border-l-4 border-indigo-500 dark:border-indigo-400 border-t border-r border-b dark:border-t-indigo-800 dark:border-r-indigo-800 dark:border-b-indigo-800 rounded-lg p-6 shadow-lg hover:shadow-xl dark:shadow-indigo-900/30 transition-all group overflow-hidden">
      {/* 背景装饰元素 */}
      <div className="absolute -right-16 -bottom-16 w-32 h-32 bg-indigo-100 dark:bg-indigo-800 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
      <div className="absolute right-4 top-4 w-2 h-2 bg-indigo-400 dark:bg-indigo-300 rounded-full"></div>
      <div className="absolute right-8 top-6 w-1.5 h-1.5 bg-indigo-300 dark:bg-indigo-400 rounded-full"></div>
      <div className="absolute right-3 top-9 w-1 h-1 bg-indigo-200 dark:bg-indigo-500 rounded-full"></div>

      {/* 内容 */}
      <div className="relative z-10">
        <div className="flex items-center mb-3">
          <span className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-md mr-3">{icon}</span>
          <h3 className="text-xl font-bold text-indigo-800 dark:text-indigo-300">{title}</h3>
        </div>
        <div className="border-t border-indigo-100 dark:border-indigo-800 pt-3">
          <p className="text-indigo-700 dark:text-indigo-200">{description}</p>
        </div>
      </div>
    </div>
  );
}
