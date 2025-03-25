import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ComponentProps } from 'react';
import config from '@/lib/config';

type StartButtonProps = {
  text: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
} & Omit<ComponentProps<typeof Button>, 'size' | 'variant' | 'className'>;

/**
 * 通用的"立即开始"按钮组件
 * 根据配置决定跳转到注册页面或联系销售页面
 */
export function StartButton({
  text,
  className = 'bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400 shadow-md',
  size = 'lg',
  variant = 'default',
  ...props
}: StartButtonProps) {
  // 根据配置决定目标链接
  const targetUrl = config.allowPublicRegistration ? '/sign-up' : '/sign-up'; // 都指向sign-up，因为现在sign-up页面会根据配置自动显示联系信息

  return (
    <Button size={size} variant={variant} className={className} asChild {...props}>
      <Link href={targetUrl}>
        {text}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  );
}
