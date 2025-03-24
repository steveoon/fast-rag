'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Button } from './ui/button';
import { signOutAction } from '@/lib/actions/sign-up';
import { useAuthStore } from '@/lib/auth/auth-store';

// 客户端版本的HeaderAuth组件
function ClientHeaderAuth() {
  const { user, loading } = useAuthStore();
  const t = useTranslations('Auth');

  if (loading) return null;

  return (
    <>
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-indigo-700 dark:text-indigo-300">
            {t('welcome', { name: user.email })}
          </span>
          <form action={signOutAction}>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {t('signOut')}
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button
            variant="outline"
            asChild
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950"
          >
            <Link href="/sign-in">{t('signIn')}</Link>
          </Button>
          <Button
            asChild
            className="bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            <Link href="/sign-up">{t('signUp')}</Link>
          </Button>
        </div>
      )}
    </>
  );
}

export function NavBar() {
  const t = useTranslations('navbar');
  const { user, loading } = useAuthStore();
  const isLoggedIn = !!user;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border-b border-indigo-50 dark:border-slate-800">
      <div className="container mx-auto flex justify-between items-center px-4 py-3">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/1024-t.svg" alt="Wolian AI" width={32} height={32} />
            <span className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
              Wolian AI
            </span>
          </Link>
        </div>

        {/* 只有未登录用户才显示导航链接 */}
        {!loading && !isLoggedIn && (
          <div className="flex gap-8 mx-auto">
            <Link
              href="/#features"
              className="text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-100"
            >
              {t('features')}
            </Link>
            <Link
              href="/#cases"
              className="text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-100"
            >
              {t('cases')}
            </Link>
            <Link
              href="/#compare"
              className="text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-100"
            >
              {t('compare')}
            </Link>
          </div>
        )}

        <div className="flex items-center gap-4">
          <ClientHeaderAuth />
        </div>
      </div>
    </nav>
  );
}
