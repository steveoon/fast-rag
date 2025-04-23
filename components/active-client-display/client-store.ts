import { create } from 'zustand';
import { type ClientInfo, getActiveClientInfo } from '@/lib/actions/get-active-client';

interface ClientState {
  clientInfo: ClientInfo | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: Date | null;

  // 操作方法
  fetchClientInfo: () => Promise<void>;
  resetClientInfo: () => void;
}

export const useClientStore = create<ClientState>(set => ({
  clientInfo: null,
  loading: true,
  error: null,
  lastUpdated: null,

  fetchClientInfo: async () => {
    set({ loading: true });
    try {
      const data = await getActiveClientInfo();
      set({
        clientInfo: data,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.error('Error fetching client info:', err);
      set({
        error: err instanceof Error ? err : new Error('Unknown error'),
      });
    } finally {
      set({ loading: false });
    }
  },

  resetClientInfo: () => {
    set({
      clientInfo: null,
      loading: false,
      error: null,
      lastUpdated: null,
    });
  },
}));
