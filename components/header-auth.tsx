import { signOutAction } from '@/lib/actions/sign-up';
import Link from 'next/link';
import { Button } from './ui/button';
import { createClient } from '@/lib/utils/supabase/server';
import AuthTranslations from './auth-translations';

export default async function AuthButton() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AuthTranslations namespace="Auth">
      {t =>
        user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-indigo-700 dark:text-indigo-300">
              {t('welcome', { name: user.email })}
            </span>
            <form action={signOutAction}>
              <Button
                type="submit"
                variant={'outline'}
                size="sm"
                className="border-indigo-300 text-indigo-700 dark:border-indigo-700 dark:text-indigo-300 hover:bg-indigo-50"
              >
                {t('signOut')}
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              asChild
              size="sm"
              variant={'ghost'}
              className="text-indigo-700 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-100"
            >
              <Link href="/sign-in">{t('signIn')}</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
            >
              <Link href="/sign-up">{t('signUp')}</Link>
            </Button>
          </div>
        )
      }
    </AuthTranslations>
  );
}
