import Link from 'next/link';
import Image from 'next/image';
import { ThemeSwitcher } from '@/components/theme-switcher';
import LanguageSelector from '@/components/modules/language/language-selector-client';
import { useTranslations } from 'next-intl';
export function Footer() {
  const t = useTranslations('footer');
  return (
    <footer className="w-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-t border-indigo-50 dark:border-slate-800">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between py-8 px-4">
        <div className="flex items-center gap-2 mb-4 sm:mb-0">
          <Link href="/" className="flex items-center">
            <Image src="/1024-t.svg" alt="Wolian AI" width={24} height={24} className="mr-2" />
            <span className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
              Wolian AI
            </span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 text-sm text-indigo-700 dark:text-indigo-300">
          <p>
            Powered by{' '}
            <Link
              href="https://wolian.cc"
              className="text-indigo-900 dark:text-indigo-100 hover:underline"
            >
              Vector Parallel Inc.
            </Link>
          </p>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <LanguageSelector />
          </div>
          <div className="text-sm text-indigo-500">
            © {new Date().getFullYear()} Wolian AI. {t('copyright')}
          </div>
        </div>
      </div>
    </footer>
  );
}
