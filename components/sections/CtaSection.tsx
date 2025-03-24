import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function CtaSection() {
  const t = useTranslations('home.cta');

  return (
    <section className="container px-4 py-24 mx-auto text-center relative">
      <div className="absolute left-1/4 top-1/2 w-64 h-64 bg-cyan-200 dark:bg-cyan-500 rounded-full opacity-30 dark:opacity-10 blur-3xl animate-pulse-slow -translate-y-1/2"></div>
      <div className="absolute right-1/4 top-1/2 w-64 h-64 bg-indigo-200 dark:bg-indigo-500 rounded-full opacity-30 dark:opacity-10 blur-3xl animate-pulse-medium -translate-y-1/2"></div>

      <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-indigo-100 dark:border-indigo-800 rounded-xl shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-900/30 p-16 max-w-4xl mx-auto relative overflow-hidden">
        {/* 装饰元素 */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-200 via-indigo-100 to-transparent dark:from-indigo-600 dark:via-indigo-700 dark:to-transparent rounded-full opacity-60 dark:opacity-20 blur-xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-cyan-200 via-blue-100 to-transparent dark:from-blue-600 dark:via-cyan-700 dark:to-transparent rounded-full opacity-60 dark:opacity-20 blur-xl"></div>

        <div className="relative z-10">
          <div className="inline-block mb-8 bg-indigo-50 dark:bg-indigo-900/40 p-3 rounded-lg">
            <ArrowRight className="w-8 h-8 text-indigo-500 dark:text-indigo-300" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-indigo-900 dark:text-white">
            {t('title1')}
            <span className="text-indigo-600 dark:text-indigo-400">{t('title2')}</span>
            {t('title3')}
          </h2>

          <div className="h-1 w-24 bg-gradient-to-r from-transparent via-indigo-500 dark:via-indigo-400 to-transparent mx-auto mb-8"></div>

          <p className="text-xl text-indigo-700 dark:text-indigo-200 mb-10 max-w-2xl mx-auto">
            {t('description1')}
            <br />
            {t('description2')}
          </p>

          <div>
            <Button
              size="lg"
              className="px-12 py-6 bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 shadow-lg hover:shadow-indigo-500/20 dark:hover:shadow-indigo-500/30 transition-all duration-300"
            >
              {t('button')}
              <ArrowRight className="ml-2" />
            </Button>
            <p className="text-sm text-indigo-500 dark:text-indigo-400 mt-4 opacity-80">
              {t('hint')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
