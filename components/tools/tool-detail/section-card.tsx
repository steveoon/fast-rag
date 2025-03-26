import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, icon: Icon, children, className = '' }: SectionCardProps) {
  return (
    <section
      className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 ${className}`}
    >
      <h3 className="text-base font-medium mb-3 flex items-center text-gray-900 dark:text-gray-100">
        <Icon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
        {title}
      </h3>
      {children}
    </section>
  );
}
