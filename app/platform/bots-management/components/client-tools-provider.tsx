'use client';

import { useClientToolsStore } from '@/components/tools/client-tools-store';
import { ReactNode, useEffect, useState } from 'react';

interface ClientToolsProviderProps {
  children: ReactNode;
}

export default function ClientToolsProvider({ children }: ClientToolsProviderProps) {
  const fetchClientTools = useClientToolsStore(state => state.fetchClientTools);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      fetchClientTools();
      setIsInitialized(true);
    }
  }, [fetchClientTools, isInitialized]);

  return <>{children}</>;
}
