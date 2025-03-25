import { resetPasswordAction } from '@/lib/actions/sign-up';
import { Message } from '@/components/form-message';
import AuthTranslations from '@/components/auth-translations';
import { HashRedirect } from './hash-redirect';
import { AuthForm } from '@/components/auth/auth-form';

export default async function ResetPassword({
  searchParams,
}: {
  searchParams: Message & {
    error?: string;
    error_description?: string;
    success?: string;
    message?: string;
  };
}) {
  let message: Message | null = null;
  if (searchParams.error) {
    message = {
      error: `${searchParams.error}: ${decodeURIComponent(searchParams.error_description || '')}`,
    };
  } else if (typeof searchParams.success === 'string') {
    message = { success: searchParams.success };
  } else if (typeof searchParams.message === 'string') {
    message = { message: searchParams.message };
  }

  return (
    <AuthTranslations namespace="Auth.ResetPasswordPage">
      {t => (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
          <HashRedirect />

          <AuthForm
            title={t('title')}
            description={t('enterYourNewPassword')}
            fields={[
              {
                name: 'password',
                type: 'password',
                label: t('newPassword'),
                placeholder: t('newPasswordPlaceholder'),
                required: true,
              },
              {
                name: 'confirmPassword',
                type: 'password',
                label: t('confirmPassword'),
                placeholder: t('confirmPasswordPlaceholder'),
                required: true,
              },
            ]}
            submitText={t('resetPassword')}
            submitPendingText={t('resetPasswordLoading')}
            formAction={resetPasswordAction}
            message={message || undefined}
          />
        </div>
      )}
    </AuthTranslations>
  );
}
