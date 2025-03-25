import { signInAction } from '@/lib/actions/sign-up';
import { type Message } from '@/components/form-message';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AuthForm } from '@/components/auth/auth-form';

export default function Login({ searchParams }: { searchParams: Message }) {
  const t = useTranslations('Auth');

  return (
    <AuthForm
      title={t('signIn')}
      description={
        <>
          {t('SignInPage.dontHaveAnAccount')}{' '}
          <Link
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            href="/sign-up"
          >
            {t('signUp')}
          </Link>
        </>
      }
      fields={[
        {
          name: 'email',
          type: 'email',
          label: t('SignInPage.email'),
          placeholder: 'you@example.com',
          required: true,
        },
        {
          name: 'password',
          type: 'password',
          label: t('SignInPage.password'),
          placeholder: t('SignInPage.passwordPlaceholder'),
          required: true,
          extraElement: (
            <Link
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              href="/forgot-password"
            >
              {t('SignInPage.forgotPassword')}
            </Link>
          ),
        },
      ]}
      submitText={t('signIn')}
      submitPendingText={t('SignInPage.signInLoading')}
      formAction={signInAction}
      message={searchParams}
    />
  );
}
