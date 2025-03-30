import { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface ConfigurableCardProps {
  icon: LucideIcon;
  title: string;
  content: ReactNode;
  primaryAction: {
    label: string;
    onClick: () => void;
    icon: LucideIcon;
    loading?: boolean;
    variant?: 'success' | 'danger';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon: LucideIcon;
    loading?: boolean;
  };
  dangerAction?: {
    label: string;
    onClick: () => void;
    icon: LucideIcon;
    loading?: boolean;
  };
}

export function ConfigurableCard({
  icon: Icon,
  title,
  content,
  primaryAction,
  secondaryAction,
  dangerAction,
}: ConfigurableCardProps) {
  const getPrimaryButtonClass = () => {
    if (primaryAction.variant === 'danger') {
      return 'flex-1 bg-red-600 hover:bg-red-700 text-white';
    }
    return 'flex-1 bg-green-600 hover:bg-green-700 text-white';
  };

  return (
    <Card className="border-0 border-t-2 border-t-pink-400 dark:border-t-pink-600 shadow-lg hover:shadow-xl transition-shadow duration-300 dark:bg-gray-900">
      <CardHeader className="pb-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 dark:bg-blue-900">
          <Icon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
        </div>
        <CardTitle className="text-xl font-semibold text-blue-900 dark:text-blue-300">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 rounded-lg p-4 mb-4">
          {content}
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={primaryAction.onClick}
            className={getPrimaryButtonClass()}
            disabled={primaryAction.loading}
          >
            <primaryAction.icon className="mr-2 h-4 w-4" />
            {primaryAction.label}
          </Button>
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              className="flex-1"
              disabled={secondaryAction.loading}
            >
              {secondaryAction.loading ? (
                <div className="animate-spin h-4 w-4 mr-2">🔄</div>
              ) : (
                <secondaryAction.icon className="mr-2 h-4 w-4" />
              )}
              {secondaryAction.label}
            </Button>
          )}
          {dangerAction && (
            <Button
              onClick={dangerAction.onClick}
              variant="destructive"
              className="flex-shrink-0"
              disabled={dangerAction.loading}
            >
              {dangerAction.loading ? (
                <div className="animate-spin h-4 w-4 mr-2">🔄</div>
              ) : (
                <dangerAction.icon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
