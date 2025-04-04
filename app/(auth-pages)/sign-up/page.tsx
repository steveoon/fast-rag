import { use } from 'react';
import { signUpAction } from '@/lib/actions/sign-up';
import { Message } from '@/components/form-message';
import Link from 'next/link';
import { SmtpMessage } from '@/components/smtp-message';
import { useTranslations } from 'next-intl';
import { AuthForm } from '@/components/auth/auth-form';
import config from '@/lib/config';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

export default function Signup(props: { searchParams: Promise<Message> }) {
  const searchParams = use(props.searchParams);
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

  // 如果不允许公开注册，显示联系销售信息
  if (!config.allowPublicRegistration) {
    return (
      <div className="relative backdrop-blur-sm bg-white/60 dark:bg-gray-900/60 border border-indigo-100 dark:border-indigo-800 rounded-xl shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-900/30 p-8 w-full max-w-md mx-auto">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold mb-2 text-indigo-900 dark:text-white">
            {t('SalesContact.title')}
          </h1>
          <div className="h-1 w-16 bg-gradient-to-r from-indigo-500 to-blue-500 dark:from-indigo-400 dark:to-blue-400 mb-6"></div>

          <p className="text-indigo-700 dark:text-indigo-300 mb-8">
            {t('SalesContact.description')}
          </p>

          <div className="mb-8 p-3 border border-indigo-100 dark:border-indigo-800 rounded-lg">
            <Image
              src={config.sales.wechatQRCodeUrl}
              alt="WeChat QR Code"
              width={200}
              height={200}
              className="rounded"
            />
            <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-2">
              {t('SalesContact.wechatScan')}
            </p>
          </div>

          <Button
            variant="outline"
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-950"
            asChild
          >
            <Link href={`mailto:${config.sales.contactEmail}`}>
              <Mail className="mr-2 h-4 w-4" />
              {config.sales.contactEmail}
            </Link>
          </Button>

          <p className="mt-8 text-sm text-indigo-600 dark:text-indigo-400">
            {t('SignUpPage.alreadyHaveAnAccount')}{' '}
            <Link className="font-medium hover:underline" href="/sign-in">
              {t('signIn')}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // 默认显示注册表单
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
