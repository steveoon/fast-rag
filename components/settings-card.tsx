import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface SettingsCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerContent?: ReactNode;
  withHeaderBorder?: boolean;
  headerClassName?: string;
  contentClassName?: string;
}

export function SettingsCard({
  title,
  description,
  children,
  className,
  headerContent,
  withHeaderBorder = false,
  headerClassName,
  contentClassName,
}: SettingsCardProps) {
  return (
    <Card
      className={cn(
        'bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border border-gray-200 dark:border-gray-800 shadow-sm',
        className
      )}
    >
      <CardHeader
        className={cn(
          withHeaderBorder && 'border-b border-gray-100 dark:border-gray-800 pb-6',
          headerClassName
        )}
      >
        {headerContent}
        {title && <CardTitle className="text-blue-900 dark:text-blue-300">{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={cn('pt-6', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
