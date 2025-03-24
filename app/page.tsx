import {
  HeroSection,
  FeaturesSection,
  UseCasesSection,
  ComparisonSection,
  CtaSection,
} from '@/components/sections';

export default function Page() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
      {/* 极光效果背景元素 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 主要极光效果 */}
        <div className="absolute -top-20 -right-40 w-[800px] h-[600px] bg-gradient-to-b from-indigo-400/30 via-blue-300/20 to-transparent dark:from-indigo-500/20 dark:via-blue-400/15 dark:to-transparent rounded-full rotate-12 blur-3xl animate-aurora-slow"></div>
        <div className="absolute top-1/4 -left-40 w-[700px] h-[500px] bg-gradient-to-r from-cyan-300/30 via-indigo-300/20 to-transparent dark:from-cyan-500/20 dark:via-indigo-400/15 dark:to-transparent rounded-full -rotate-6 blur-3xl animate-aurora-medium"></div>
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-gradient-to-l from-purple-400/30 via-indigo-300/20 to-transparent dark:from-purple-500/20 dark:via-indigo-400/15 dark:to-transparent rounded-full rotate-12 blur-3xl animate-aurora-fast"></div>
        <div className="absolute -bottom-20 left-20 w-[600px] h-[400px] bg-gradient-to-t from-blue-300/30 via-indigo-200/20 to-transparent dark:from-blue-500/20 dark:via-indigo-400/15 dark:to-transparent rounded-full -rotate-12 blur-3xl animate-aurora-slow"></div>

        {/* 较小的光点 */}
        <div className="absolute top-[15%] right-[35%] w-64 h-64 bg-cyan-200 dark:bg-cyan-400 rounded-full opacity-40 dark:opacity-20 blur-4xl animate-pulse-slow"></div>
        <div className="absolute top-[45%] left-[20%] w-48 h-48 bg-indigo-300 dark:bg-indigo-500 rounded-full opacity-30 dark:opacity-15 blur-3xl animate-pulse-medium"></div>
        <div className="absolute bottom-[25%] right-[15%] w-56 h-56 bg-purple-200 dark:bg-purple-500 rounded-full opacity-30 dark:opacity-15 blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-[10%] left-[30%] w-40 h-40 bg-blue-200 dark:bg-blue-400 rounded-full opacity-40 dark:opacity-20 blur-3xl animate-pulse-medium"></div>

        {/* 悬浮小光点 */}
        <div className="absolute top-40 left-1/4 w-8 h-8 bg-indigo-400 dark:bg-indigo-300 rounded-full opacity-60 blur-lg animate-float-slow"></div>
        <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-cyan-400 dark:bg-cyan-300 rounded-full opacity-70 blur-lg animate-float-medium"></div>

        {/* 额外的随机悬浮小光点 */}
        <div className="absolute top-[65%] right-[25%] w-4 h-4 bg-cyan-300 dark:bg-cyan-200 rounded-full opacity-70 dark:opacity-60 blur-lg animate-float-fast"></div>
        <div className="absolute top-[85%] right-[40%] w-9 h-9 bg-purple-300 dark:bg-purple-200 rounded-full opacity-50 dark:opacity-40 blur-lg animate-float-slow"></div>
      </div>

      {/* 原有装饰背景元素 - 增加不透明度以便更好看到动画 */}
      <div className="absolute top-40 right-20 w-96 h-96 bg-blue-300 dark:bg-blue-500 rounded-full opacity-20 dark:opacity-10 blur-3xl animate-aurora-slow"></div>
      <div className="absolute top-80 left-20 w-80 h-80 bg-indigo-300 dark:bg-indigo-500 rounded-full opacity-20 dark:opacity-10 blur-3xl animate-aurora-medium"></div>
      <div className="absolute bottom-40 right-40 w-72 h-72 bg-indigo-300 dark:bg-indigo-500 rounded-full opacity-20 dark:opacity-10 blur-3xl animate-aurora-fast"></div>

      {/* 各个Section组件 */}
      <HeroSection />
      <FeaturesSection />
      <UseCasesSection />
      <ComparisonSection />
      <CtaSection />
    </div>
  );
}
