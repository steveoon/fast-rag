import { signUpAction } from '@/lib/actions/sign-up';
import { Message } from '@/components/form-message';
import Link from 'next/link';
import { SmtpMessage } from '@/components/smtp-message';
import { useTranslations } from 'next-intl';
import { AuthForm } from '@/components/auth/auth-form';

export default function Signup({ searchParams }: { searchParams: Message }) {
  const t = useTranslations('Auth');

  if ('message' in searchParams) {
    return (
      <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-indigo-100 dark:border-indigo-800 rounded-xl shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-900/30 p-8 w-full max-w-md mx-auto">
        <AuthForm
          title={t('signUp')}
          fields={[]}
          submitText=""
          submitPendingText=""
          formAction={async () => {
            // 这种情况下无需表单操作，只显示消息
            return { message: '' };
          }}
          message={searchParams}
        />
      </div>
    );
  }

  return (
    <AuthForm
      title={t('signUp')}
      description={
        <>
          {t('SignUpPage.alreadyHaveAnAccount')}{' '}
          <Link
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            href="/sign-in"
          >
            {t('signIn')}
          </Link>
        </>
      }
      fields={[
        {
          name: 'email',
          type: 'email',
          label: t('SignUpPage.email'),
          placeholder: 'you@example.com',
          required: true,
        },
        {
          name: 'password',
          type: 'password',
          label: t('SignUpPage.password'),
          placeholder: t('SignUpPage.passwordPlaceholder'),
          minLength: 6,
          required: true,
        },
      ]}
      submitText={t('signUp')}
      submitPendingText={t('SignUpPage.signUpLoading')}
      formAction={signUpAction}
      message={searchParams}
      footer={
        <SmtpMessage
          message={t('SignUpPage.smtpMessage')}
          linkText={t('SignUpPage.smtpLinkText')}
          linkHref="/"
          className="text-indigo-700 dark:text-indigo-300 text-sm"
        />
      }
    />
  );
}
