import { useTranslations } from 'next-intl';

export function ComparisonSection() {
  const t = useTranslations('home');

  return (
    <section id="compare" className="container px-4 py-24 mx-auto relative">
      <div className="absolute -right-40 top-20 w-96 h-96 bg-indigo-300 dark:bg-indigo-500 rounded-full opacity-20 dark:opacity-10 blur-3xl animate-aurora-slow"></div>
      <div className="text-center max-w-3xl mx-auto mb-16 relative">
        <span className="inline-block mb-2 text-sm font-semibold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full">
          {t('comparison.sectionTag')}
        </span>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-indigo-900 dark:text-white flex items-center justify-center gap-3">
          <span className="w-8 h-0.5 bg-gradient-to-r from-transparent to-indigo-500 dark:to-indigo-400"></span>
          {t('comparison.title')}
          <span className="w-8 h-0.5 bg-gradient-to-r from-indigo-500 dark:from-indigo-400 to-transparent"></span>
        </h2>
        <div className="h-1 w-24 bg-gradient-to-r from-transparent via-indigo-500 dark:via-indigo-400 to-transparent mx-auto mb-6"></div>
        <p className="text-lg text-indigo-700 dark:text-indigo-300 max-w-2xl mx-auto">
          {t('comparison.description')}
        </p>
      </div>

      <div className="backdrop-blur-sm bg-white/70 dark:bg-gray-900/70 border border-indigo-100 dark:border-indigo-800 rounded-xl shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-900/30 overflow-hidden relative max-w-4xl mx-auto">
        {/* 装饰元素 */}
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-200 dark:bg-indigo-500 rounded-full opacity-30 dark:opacity-15 blur-xl"></div>
        <div className="absolute left-1/3 -bottom-10 w-32 h-32 bg-blue-200 dark:bg-blue-500 rounded-full opacity-20 dark:opacity-10 blur-xl"></div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="py-5 px-6 text-left text-indigo-900 dark:text-indigo-300 font-bold text-lg bg-gradient-to-r from-indigo-50/80 to-white/80 dark:from-indigo-900/80 dark:to-gray-900/80 border-b-2 border-indigo-200 dark:border-indigo-700 rounded-tl-lg">
                  <div className="flex items-center">
                    <span className="mr-2 text-indigo-500 dark:text-indigo-400">✦</span>
                    {t('comparison.table.feature')}
                  </div>
                </th>
                <th className="py-5 px-6 text-left text-indigo-900 dark:text-indigo-300 font-bold text-lg bg-gradient-to-r from-indigo-100/80 to-indigo-50/80 dark:from-indigo-800/80 dark:to-indigo-900/80 border-b-2 border-indigo-400 dark:border-indigo-500">
                  <div className="flex items-center">
                    <span className="bg-indigo-600 dark:bg-indigo-500 text-white text-xs px-2 py-1 rounded-full mr-2">
                      {t('comparison.table.wolianLabel')}
                    </span>
                    {t('comparison.table.wolianTitle')}
                  </div>
                </th>
                <th className="py-5 px-6 text-left text-indigo-900 dark:text-indigo-300 font-bold text-lg bg-white/80 dark:bg-gray-900/80 border-b-2 border-indigo-200 dark:border-indigo-700 rounded-tr-lg">
                  {t('comparison.table.traditional')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100 dark:divide-indigo-800">
              {/* 工作模式行 */}
              <ComparisonRow featureKey="workMode" />

              {/* 灵活性行 */}
              <ComparisonRow featureKey="flexibility" />

              {/* 知识库行 */}
              <ComparisonRow featureKey="knowledge" />

              {/* 场景行 */}
              <ComparisonRow featureKey="scenarios" />

              {/* 部署行 */}
              <ComparisonRow featureKey="deployment" />
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// 表格行组件
function ComparisonRow({ featureKey }: { featureKey: string }) {
  const t = useTranslations('home');

  return (
    <tr className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/30 transition-colors duration-150">
      <td className="py-4 px-6 text-indigo-800 dark:text-indigo-300">
        <div className="font-medium">{t(`comparison.table.${featureKey}.title`)}</div>
        <div className="text-xs text-indigo-500 dark:text-indigo-400 mt-1">
          {t(`comparison.table.${featureKey}.subtitle`)}
        </div>
      </td>
      <td className="py-4 px-6 text-indigo-700 dark:text-indigo-300 font-medium border-l border-indigo-100 dark:border-indigo-800">
        <div className="flex items-center">
          <span className="text-indigo-600 dark:text-indigo-400 mr-2">✓</span>
          {t(`comparison.table.${featureKey}.wolian`)}
        </div>
        <div className="text-xs text-indigo-500 dark:text-indigo-400 mt-1 pl-5">
          {t(`comparison.table.${featureKey}.wolianDetail`)}
        </div>
      </td>
      <td className="py-4 px-6 text-indigo-500 dark:text-indigo-500 border-l border-indigo-100 dark:border-indigo-800">
        <div className="flex items-center">
          <span className="text-indigo-300 dark:text-indigo-600 mr-2">○</span>
          {t(`comparison.table.${featureKey}.competitor`)}
        </div>
        <div className="text-xs text-indigo-400 dark:text-indigo-500 mt-1 pl-5">
          {t(`comparison.table.${featureKey}.competitorDetail`)}
        </div>
      </td>
    </tr>
  );
}
