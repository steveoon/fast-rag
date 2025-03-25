import { User } from '@supabase/supabase-js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon, Mail, Calendar, Key } from 'lucide-react';
import { SettingsCard } from '@/components/settings-card';
import { useTranslations } from 'next-intl';

interface UserProfileCardProps {
  user: User;
  className?: string;
}

export function UserProfileCard({ user, className }: UserProfileCardProps) {
  const t = useTranslations('Platform.GeneralSettings.userProfile');

  // 格式化日期函数
  const formatDate = (dateString?: string) => {
    if (!dateString) return t('unknown');
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const headerContent = (
    <div className="flex items-center gap-4 mb-4">
      <Avatar className="h-16 w-16 border-2 border-blue-100 dark:border-blue-800">
        <AvatarImage src={user.user_metadata?.avatar_url} />
        <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-lg">
          {user.email?.substring(0, 2).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      <div>
        <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-300">
          {user.user_metadata?.full_name || user.email?.split('@')[0] || t('defaultUser')}
        </h3>
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Mail className="h-4 w-4" />
          <span>{user.email}</span>
        </div>
      </div>
    </div>
  );

  return (
    <SettingsCard headerContent={headerContent} withHeaderBorder={true} className={className}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800"
          >
            {user.role || t('defaultUser')}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-1">
              <UserIcon className="h-4 w-4" />
              <span>{t('userId')}</span>
            </div>
            <div className="text-gray-800 dark:text-gray-200 font-mono text-sm break-all">
              {user.id}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-1">
              <Key className="h-4 w-4" />
              <span>{t('authMethod')}</span>
            </div>
            <div className="text-gray-800 dark:text-gray-200">
              {user.app_metadata?.provider || t('emailPassword')}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4" />
              <span>{t('createdAt')}</span>
            </div>
            <div className="text-gray-800 dark:text-gray-200">{formatDate(user.created_at)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4" />
              <span>{t('lastUpdated')}</span>
            </div>
            <div className="text-gray-800 dark:text-gray-200">{formatDate(user.updated_at)}</div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('fullUserInfo')}</div>
          <div className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg">
            <pre className="text-xs font-mono max-h-64 overflow-auto text-gray-700 dark:text-gray-300">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
