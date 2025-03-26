'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InfoIcon, Settings, Eye, Wrench, Check, Loader2 } from 'lucide-react';
import { ToolDetail } from './tool-detail';
import { ToolWithParameters } from '@/lib/actions/tools-quire/get-tools';
import { useTranslations } from 'next-intl';
import { useSelectedToolsStore } from '@/components/tools/selected-tools-store';
import { cn } from '@/lib/utils';

interface ToolCardProps {
  tool: ToolWithParameters;
  onApply?: (toolId: string) => Promise<void>;
  isApplying?: boolean;
}

export function ToolCard({ tool, onApply, isApplying = false }: ToolCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const t = useTranslations('Platform.ToolsManagement');

  const { isSelectionMode, toggleToolSelection, isToolSelected } = useSelectedToolsStore();

  const selected = isToolSelected(tool.id);

  const handleClick = () => {
    if (isSelectionMode) {
      toggleToolSelection(tool);
    }
  };

  const handleApply = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApply && !isApplying) {
      await onApply(tool.id);
    }
  };

  return (
    <>
      <Card
        className={cn(
          'border-0 border-t-2 border-t-pink-400 dark:border-t-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 dark:bg-gray-900 flex flex-col h-full relative',
          isSelectionMode && 'cursor-pointer',
          selected && 'ring-2 ring-green-500 ring-offset-2'
        )}
        onClick={handleClick}
      >
        {isSelectionMode && selected && (
          <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
            <Check className="h-4 w-4" />
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center dark:bg-blue-900">
                <Wrench className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <CardTitle className="text-lg text-blue-900 dark:text-blue-300">
                  {tool.display_name}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">
                  {tool.name}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={
                tool.status === 'active'
                  ? 'default'
                  : tool.status === 'deprecated'
                    ? 'secondary'
                    : 'destructive'
              }
              className={`text-xs ${
                tool.status === 'active'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
                  : tool.status === 'deprecated'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800'
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
              }`}
            >
              {tool.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-2 flex-grow">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{tool.description}</p>
          <div className="mt-4 border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 rounded-lg p-3">
            <h4 className="text-sm font-medium mb-2 flex items-center text-blue-900 dark:text-blue-300">
              <Settings className="h-3 w-3 mr-1 text-blue-600 dark:text-blue-300" />
              {t('parameters')}
            </h4>
            <div className="space-y-1">
              {tool.parameters?.slice(0, 3).map(param => (
                <div
                  key={param.id}
                  className="flex justify-between items-center text-xs px-2 py-1 rounded bg-muted/50"
                >
                  <div className="flex items-center">
                    <span className="font-medium">{param.name}</span>
                    {param.is_required && <span className="text-destructive ml-1">*</span>}
                  </div>
                  <Badge variant="outline" className="text-[10px] h-4">
                    {param.type}
                  </Badge>
                </div>
              ))}
              {tool.parameters && tool.parameters.length > 3 && (
                <div className="text-xs text-center text-blue-600 dark:text-blue-400 mt-1">
                  + {tool.parameters.length - 3} {t('moreParameters')}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-1 flex justify-between">
          <div className="flex items-center text-xs text-muted-foreground">
            <InfoIcon className="h-3 w-3 mr-1" />
            {t('version')} {tool.version}
          </div>
          <div className="flex space-x-2">
            {!isSelectionMode && onApply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-green-600 hover:text-green-800 hover:bg-green-100 dark:text-green-300 dark:hover:text-green-100 dark:hover:bg-green-900"
                onClick={handleApply}
                disabled={isApplying}
              >
                {isApplying ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                {t('apply')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-100 dark:text-blue-300 dark:hover:text-blue-100 dark:hover:bg-blue-900"
              onClick={e => {
                e.stopPropagation();
                setShowDetails(true);
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              {t('details')}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <ToolDetail tool={tool} isOpen={showDetails} onClose={() => setShowDetails(false)} />
    </>
  );
}
