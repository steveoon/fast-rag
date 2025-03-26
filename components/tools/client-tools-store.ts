import { create } from 'zustand';
import { ClientToolWithDetails } from '@/lib/actions/tools-quire/get-client-tools';
import api from '@/lib/request';
import { toast } from '@/hooks/use-toast';

interface ClientToolsResponse {
  tools: ClientToolWithDetails[];
  error: string | null;
}

interface UpdateStatusResponse {
  success: boolean;
  message: string;
}

interface ClientToolsState {
  clientTools: ClientToolWithDetails[];
  isLoading: boolean;
  error: string | null;
  // 获取客户端工具列表
  fetchClientTools: () => Promise<void>;
  // 更新单个工具状态
  updateToolStatus: (toolId: string, isEnabled: boolean) => Promise<boolean>;
  // 重置状态
  reset: () => void;
}

export const useClientToolsStore = create<ClientToolsState>(set => ({
  clientTools: [],
  isLoading: false,
  error: null,

  fetchClientTools: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<ClientToolsResponse>('/client-tools/list');

      if (response.data && Array.isArray(response.data.tools)) {
        set({
          clientTools: response.data.tools,
          error: null,
        });
      } else {
        set({ error: '获取客户端工具失败' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取客户端工具失败';
      set({ error: message });
      toast({
        title: '错误',
        description: message,
        variant: 'destructive',
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updateToolStatus: async (toolId: string, isEnabled: boolean) => {
    try {
      const response = await api.patch<UpdateStatusResponse>('/client-tools/update-status', {
        id: toolId,
        is_enabled: isEnabled,
      });

      if (response.data && response.data.success) {
        // 更新本地状态
        set(state => ({
          clientTools: state.clientTools.map(tool =>
            tool.id === toolId ? { ...tool, is_enabled: isEnabled } : tool
          ),
        }));

        toast({
          title: response.data.message || (isEnabled ? '工具已启用' : '工具已禁用'),
        });

        return true;
      }

      throw new Error('操作失败');
    } catch {
      toast({
        title: '更新失败',
        variant: 'destructive',
      });
      return false;
    }
  },

  reset: () => {
    set({
      clientTools: [],
      isLoading: false,
      error: null,
    });
  },
}));
