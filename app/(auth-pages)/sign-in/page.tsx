import { signInAction } from '@/lib/actions/sign-up';
import { FormMessage, type Message } from '@/components/form-message';
import { SubmitButton } from '@/components/submit-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function Login({ searchParams }: { searchParams: Message }) {
  const t = useTranslations('Auth');

  return (
    <form className="flex-1 flex flex-col min-w-64">
      <h1 className="text-2xl font-medium">{t('signIn')}</h1>
      <p className="text-sm text-foreground">
        {t('SignInPage.dontHaveAnAccount')}
        <Link className="text-foreground font-medium underline" href="/sign-up">
          {t('signUp')}
        </Link>
      </p>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">{t('SignInPage.email')}</Label>
        <Input name="email" placeholder="you@example.com" required />
        <div className="flex justify-between items-center">
          <Label htmlFor="password">{t('SignInPage.password')}</Label>
          <Link className="text-xs text-foreground underline" href="/forgot-password">
            {t('SignInPage.forgotPassword')}
          </Link>
        </div>
        <Input
          type="password"
          name="password"
          placeholder={t('SignInPage.passwordPlaceholder')}
          required
        />
        <SubmitButton pendingText={t('SignInPage.signInLoading')} formAction={signInAction}>
          {t('signIn')}
        </SubmitButton>
        <FormMessage message={searchParams} />
      </div>
    </form>
  );
}
