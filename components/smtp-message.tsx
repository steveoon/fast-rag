import { ArrowUpRight, InfoIcon } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface SmtpMessageProps {
  message: string;
  linkText?: string;
  linkHref?: string;
  className?: string;
}

export function SmtpMessage({ message, linkText, linkHref, className }: SmtpMessageProps) {
  return (
    <div
      className={cn(
        'bg-indigo-50/50 dark:bg-indigo-950/30 px-5 py-3 border border-indigo-100 dark:border-indigo-800 rounded-md flex gap-4',
        className
      )}
    >
      <InfoIcon size={16} className="mt-0.5 text-indigo-500 dark:text-indigo-400" />
      <div className="flex flex-col gap-1">
        <small className="text-sm text-indigo-700 dark:text-indigo-300">
          <strong>Note:</strong> {message}
        </small>
        {linkText && linkHref && (
          <div>
            <Link
              href={linkHref}
              target="_blank"
              className="text-indigo-600/70 dark:text-indigo-400/70 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center text-sm gap-1 transition-colors"
            >
              {linkText} <ArrowUpRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
