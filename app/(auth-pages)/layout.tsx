import { ReactNode } from 'react';
import { AuroraBackground } from '@/components/aurora-background';

export default async function Layout({ children }: { children: ReactNode }) {
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
