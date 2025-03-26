import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusType = 'active' | 'deprecated' | 'disabled' | 'public' | 'private' | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusVariants: Record<string, string> = {
  active:
    'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800',
  deprecated:
    'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800',
  disabled:
    'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800',
  public:
    'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800',
  private:
    'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800',
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  // 获取状态样式，如果不存在使用active的样式作为默认值
  const statusVariant = statusVariants[status] || statusVariants.active;

  // 显示文本：优先使用label，如果没有则使用status
  const displayText = label || status;

  return <Badge className={cn(statusVariant, className)}>{displayText}</Badge>;
}
