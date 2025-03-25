import { signInAction } from '@/lib/actions/sign-up';
import { FormMessage, type Message } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';

export default function Login({ searchParams }: { searchParams: Message }) {
  const t = useTranslations('Auth');

  return (
    <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-indigo-100 dark:border-indigo-800 rounded-xl shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-900/30 p-8 w-full max-w-md mx-auto">
      <form className="flex flex-col">
        <h1 className="text-3xl font-bold mb-2 text-indigo-900 dark:text-white">{t('signIn')}</h1>
        <div className="h-1 w-16 bg-gradient-to-r from-indigo-500 to-blue-500 dark:from-indigo-400 dark:to-blue-400 mb-6"></div>

        <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-8">
          {t('SignInPage.dontHaveAnAccount')}{' '}
          <Link
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            href="/sign-up"
          >
            {t('signUp')}
          </Link>
        </p>

        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-indigo-800 dark:text-indigo-300">
              {t('SignInPage.email')}
            </Label>
            <Input
              name="email"
              placeholder="you@example.com"
              required
              className="border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white/80 dark:bg-gray-800/80"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-indigo-800 dark:text-indigo-300">
                {t('SignInPage.password')}
              </Label>
              <Link
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                href="/forgot-password"
              >
                {t('SignInPage.forgotPassword')}
              </Link>
            </div>
            <Input
              type="password"
              name="password"
              placeholder={t('SignInPage.passwordPlaceholder')}
              required
              className="border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 dark:focus:border-indigo-400 bg-white/80 dark:bg-gray-800/80"
            />
          </div>

          <SubmitButton
            pendingText={t('SignInPage.signInLoading')}
            formAction={signInAction}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 text-white font-medium py-2 rounded-md flex items-center justify-center"
          >
            {t('signIn')} <ArrowRight className="ml-2 h-4 w-4" />
          </SubmitButton>

          <FormMessage message={searchParams} />
        </div>
      </form>
    </div>
  );
}
