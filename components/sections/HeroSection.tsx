import { Button } from '@/components/ui/button';
import { StartButton } from '@/components/ui/start-button';
import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export function HeroSection() {
  const t = useTranslations('home');

  return (
    <section className="container px-4 py-20 mx-auto relative">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div className="text-left">
          <h1 className="text-5xl font-bold tracking-tight mb-4 text-indigo-900 dark:text-white">
            {t('hero.title1')}
            <br />
            {t('hero.title2')}
            <span className="text-indigo-600 dark:text-indigo-400">{t('hero.title3')}</span>
            {t('hero.title4')}
          </h1>
          <p className="mt-6 text-lg text-indigo-700 dark:text-indigo-200 max-w-xl">
            {t('hero.description')}
          </p>
          <div className="mt-10 flex gap-4">
            <StartButton text={t('hero.startButton')} />
            <Button
              variant="outline"
              size="lg"
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950"
              asChild
            >
              <Link
                href="https://verbena-animantarx-4e7.notion.site/Help-Center-Knowledge-Base-1c1364213db48065be8bea173787f4c7?pvs=4"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('hero.docsButton')}
                <FileText className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-200 dark:bg-indigo-500 rounded-full opacity-20 blur-xl"></div>
          <div className="backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-indigo-100 dark:border-indigo-800 rounded-xl shadow-lg dark:shadow-indigo-900/30 p-6 z-10 relative">
            <div className="mb-4 font-semibold text-indigo-900 dark:text-indigo-300">
              {t('hero.demoTitle')}
            </div>
            <div className="border-l-4 border-indigo-500 dark:border-indigo-400 pl-4 py-2 mb-4">
              <div className="text-sm text-indigo-700 dark:text-indigo-300">
                {t('hero.demoUserQuestion')}
              </div>
              <div className="font-medium dark:text-gray-200">{t('hero.demoQuestion')}</div>
            </div>
            <div className="bg-indigo-50/80 dark:bg-indigo-900/30 p-3 rounded-lg mb-4">
              <div className="text-xs text-indigo-600 dark:text-indigo-300 mb-1">
                {t('hero.demoThinking')}
              </div>
              <div className="text-sm dark:text-gray-300">
                1. {t('hero.demoStep1')}
                <br />
                2. {t('hero.demoStep2')}
                <br />
                3. {t('hero.demoStep3')}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap mb-3">
              <div className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/70 dark:text-purple-200 px-2 py-1 rounded-full">
                {t('hero.demoTool1')}
              </div>
              <div className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200 px-2 py-1 rounded-full">
                {t('hero.demoTool2')}
              </div>
              <div className="text-xs bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-200 px-2 py-1 rounded-full">
                {t('hero.demoTool3')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
