import { createClient } from '@/lib/utils/supabase/server';
import { redirect } from 'next/navigation';
import TranslationWrapper from '@/components/auth-translations';
import { UserProfileCard } from '@/components/user-profile-card';
import { PreferencesCard } from '@/components/preferences-card';

export default async function GeneralSettingsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/sign-in');
  }

  return (
    <TranslationWrapper namespace="Platform.GeneralSettings">
      {t => (
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-blue-900 mb-4 dark:text-blue-300">
              {t('title') || '通用设置'}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t('subtitle') || '管理您的账户信息和偏好设置'}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* 用户信息卡片 */}
            <UserProfileCard user={user} />

            {/* 偏好设置卡片 */}
            <PreferencesCard
              title={t('preferences') || '偏好设置'}
              description={t('preferencesDescription') || '管理您的应用程序偏好设置'}
            />
          </div>
        </div>
      )}
    </TranslationWrapper>
  );
}
