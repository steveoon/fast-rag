import { ReactNode } from 'react';

interface InfoFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function InfoField({ label, children, className = '' }: InfoFieldProps) {
  return (
    <div
      className={`space-y-1 bg-gray-50 dark:bg-gray-950 p-3 rounded border border-gray-100 dark:border-gray-800 ${className}`}
    >
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}
