import { ReactNode } from 'react';
import { SettingsCard } from '@/components/settings-card';
import { useTranslations } from 'next-intl';

interface PreferencesCardProps {
  title?: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

export function PreferencesCard({ title, description, className, children }: PreferencesCardProps) {
  const t = useTranslations('Platform.GeneralSettings');

  return (
    <SettingsCard
      title={title || t('preferences')}
      description={description || t('preferencesDescription')}
      className={className}
    >
      {children || (
        <p className="text-gray-600 dark:text-gray-400">
          {t('comingSoon', { fallback: '更多设置选项即将推出...' })}
        </p>
      )}
    </SettingsCard>
  );
}
