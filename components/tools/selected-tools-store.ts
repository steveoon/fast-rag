import { create } from 'zustand';
import { ToolWithParameters } from '@/lib/actions/tools-quire/get-tools';
import api from '@/lib/request';
import { toast } from '@/hooks/use-toast';

interface SelectedToolsState {
  selectedTools: ToolWithParameters[];
  isSelectionMode: boolean;
  isApplying: boolean;
  toggleSelectionMode: () => void;
  toggleToolSelection: (tool: ToolWithParameters) => void;
  isToolSelected: (toolId: string) => boolean;
  clearSelection: () => void;
  getSelectedToolIds: () => string[];
  applySelectedTools: () => Promise<boolean>;
  applySingleTool: (toolId: string) => Promise<boolean>;
}

export const useSelectedToolsStore = create<SelectedToolsState>((set, get) => ({
  selectedTools: [],
  isSelectionMode: false,
  isApplying: false,

  toggleSelectionMode: () => {
    set(state => ({
      isSelectionMode: !state.isSelectionMode,
      // 退出选择模式时清空选择
      selectedTools: !state.isSelectionMode ? state.selectedTools : [],
    }));
  },

  toggleToolSelection: tool => {
    set(state => {
      // 检查工具是否已经被选中
      const isSelected = state.selectedTools.some(t => t.id === tool.id);

      if (isSelected) {
        // 如果已选中，则移除
        return {
          selectedTools: state.selectedTools.filter(t => t.id !== tool.id),
        };
      } else {
        // 如果未选中，则添加
        return {
          selectedTools: [...state.selectedTools, tool],
        };
      }
    });
  },

  isToolSelected: toolId => {
    return get().selectedTools.some(tool => tool.id === toolId);
  },

  clearSelection: () => {
    set({ selectedTools: [] });
  },

  getSelectedToolIds: () => {
    return get().selectedTools.map(tool => tool.id);
  },

  // 应用选中的工具
  applySelectedTools: async () => {
    const { getSelectedToolIds, clearSelection, toggleSelectionMode } = get();
    const toolIds = getSelectedToolIds();

    if (!toolIds.length) return false;

    set({ isApplying: true });

    try {
      const response = await api.post('/client-tools/apply-tool', { toolIds });
      const responseData = response.data as Record<string, unknown>;
      // 使用类型断言解决类型不匹配问题
      toast({
        title: (responseData.message as string) ?? response.message,
      });

      // 成功后清空选择并退出选择模式
      clearSelection();
      toggleSelectionMode();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '应用工具失败';
      toast({
        title: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      set({ isApplying: false });
    }
  },

  // 应用单个工具
  applySingleTool: async (toolId: string) => {
    set({ isApplying: true });

    try {
      const response = await api.post('/client-tools/apply-tool', { toolIds: [toolId] });
      const responseData = response.data as Record<string, unknown>;

      toast({
        title: (responseData.message as string) ?? response.message,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '应用工具失败';
      toast({
        title: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      set({ isApplying: false });
    }
  },
}));
