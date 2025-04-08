'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollapsibleDrawerProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function CollapsibleDrawer({
  title,
  children,
  defaultOpen = false,
}: CollapsibleDrawerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden mb-2">
      <Button
        variant="ghost"
        className="w-full flex justify-between items-center px-3 py-2 text-sm font-medium"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      {isOpen && <div className="p-3 bg-gray-50 dark:bg-gray-800 text-sm">{children}</div>}
    </div>
  );
}
