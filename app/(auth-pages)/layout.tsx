import { ReactNode } from 'react';
import { AuroraBackground } from '@/components/aurora-background';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/utils/supabase/server';

export default async function Layout({ children }: { children: ReactNode }) {
  // 检查用户登录状态
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 如果用户已登录，重定向到平台页面
  if (session) {
    redirect('/platform');
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
      {/* 使用极光背景组件 */}
      <AuroraBackground variant="minimal" />

      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full flex flex-col items-center">{children}</div>
      </div>
    </div>
  );
}
