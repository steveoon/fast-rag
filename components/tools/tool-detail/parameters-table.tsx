import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface Parameter {
  id: string;
  name: string;
  display_name: string;
  description: string;
  type: string;
  is_required: boolean;
  default_value: unknown;
}

interface ParametersTableProps {
  parameters: Parameter[];
  className?: string;
}

export function ParametersTable({ parameters, className = '' }: ParametersTableProps) {
  const t = useTranslations('Platform.ToolsManagement');

  if (!parameters?.length) {
    return (
      <div
        className={`text-center py-4 text-gray-500 dark:text-gray-400 border border-dashed rounded-lg ${className}`}
      >
        {t('noParameters')}
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-gray-950">
          <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-950">
            <TableHead className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-[15%]">
              {t('Table.name')}
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-[20%]">
              {t('Table.displayName')}
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-[30%]">
              {t('Table.description')}
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-[10%]">
              {t('Table.type')}
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-[10%]">
              {t('Table.required')}
            </TableHead>
            <TableHead className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-[15%]">
              {t('Table.defaultValue')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parameters.map((param, index) => (
            <TableRow
              key={param.id}
              className={cn(
                'transition-colors hover:bg-gray-50 dark:hover:bg-gray-950',
                index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-950/50'
              )}
            >
              <TableCell className="font-mono text-xs text-gray-900 dark:text-gray-300 font-medium">
                {param.name}
              </TableCell>
              <TableCell className="text-sm text-gray-700 dark:text-gray-400">
                {param.display_name}
              </TableCell>
              <TableCell className="text-sm text-gray-600 dark:text-gray-500">
                {param.description}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono text-xs bg-gray-50 dark:bg-gray-900">
                  {param.type}
                </Badge>
              </TableCell>
              <TableCell>
                {param.is_required ? (
                  <Badge variant="destructive" className="text-xs">
                    {t('Table.required')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-gray-500 dark:text-gray-400">
                    {t('Table.optional')}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-mono text-xs text-gray-700 dark:text-gray-400">
                {param.default_value !== null ? (
                  <span className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                    {JSON.stringify(param.default_value)}
                  </span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-600">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
