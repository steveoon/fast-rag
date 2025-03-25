import {
  HeroSection,
  FeaturesSection,
  UseCasesSection,
  ComparisonSection,
  CtaSection,
} from '@/components/sections';
import { AuroraBackground } from '@/components/aurora-background';

export default function Page() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950">
      {/* 使用极光背景组件 */}
      <AuroraBackground variant="full" />

      {/* 各个Section组件 */}
      <HeroSection />
      <FeaturesSection />
      <UseCasesSection />
      <ComparisonSection />
      <CtaSection />
    </div>
  );
}
