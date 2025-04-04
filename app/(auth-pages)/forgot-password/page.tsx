import { use } from 'react';
import { forgotPasswordAction } from '@/lib/actions/sign-up';
import { FormMessage, Message } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { SmtpMessage } from '@/components/smtp-message';
import { useTranslations } from 'next-intl';

export default function ForgotPassword(props: { searchParams: Promise<Message> }) {
  const searchParams = use(props.searchParams);
  const t = useTranslations('Auth');

  return (
    <>
      <form className="flex-1 flex flex-col w-full gap-2 text-foreground [&>input]:mb-6 min-w-64 max-w-64 mx-auto">
        <div>
          <h1 className="text-2xl font-medium">{t('ForgotPasswordPage.title')}</h1>
          <p className="text-sm text-secondary-foreground">
            {t('ForgotPasswordPage.alreadyHaveAnAccount')}
            <Link className="text-primary underline" href="/sign-in">
              {t('signIn')}
            </Link>
          </p>
        </div>
        <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
          <Label htmlFor="email">{t('ForgotPasswordPage.email')}</Label>
          <Input name="email" placeholder="you@example.com" required />
          <SubmitButton
            pendingText={t('ForgotPasswordPage.resetPasswordLoading')}
            formAction={forgotPasswordAction}
          >
            {t('ForgotPasswordPage.resetPassword')}
          </SubmitButton>
          <FormMessage message={searchParams} />
        </div>
      </form>
      <SmtpMessage
        message={t('ForgotPasswordPage.smtpMessage')}
        linkText={t('SignUpPage.smtpLinkText')}
        linkHref="/"
      />
    </>
  );
}
