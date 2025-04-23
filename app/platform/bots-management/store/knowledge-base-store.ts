import { create } from 'zustand';
import {
  getActiveClientDocuments,
  getBotAssignedKnowledgeBases,
  updateBotKnowledgeBases,
} from '@/lib/actions/bot-knowledge-base';
import { DocumentType } from '@/lib/db/schema/schema';

// 文档版本类型
export interface DocumentVersion {
  id: string;
  version: number;
  name: string | null;
  createdAt: string;
}

// 文档类型
export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  versions: DocumentVersion[];
  createdAt?: string;
  updatedAt?: string;
}

// 已分配给机器人的知识库版本
export interface AssignedKnowledgeBase {
  id: string;
  documentVersionId: string;
  documentId: string;
  documentName: string;
  documentType: DocumentType;
  versionNumber: number;
  versionName: string | null;
}

interface KnowledgeBaseState {
  // 状态
  documents: Document[];
  assignedKnowledgeBases: AssignedKnowledgeBase[];
  selectedVersionIds: string[];
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  openDocuments: Set<string>;

  // 缓存状态
  documentsLoaded: boolean; // 是否已加载文档列表
  loadedBotIds: Set<string>; // 已加载知识库的机器人ID列表
  currentBotId: string | null; // 当前正在操作的机器人ID

  // 操作方法
  fetchClientDocuments: () => Promise<void>;
  fetchBotKnowledgeBases: (botId: string) => Promise<void>;
  updateBotKnowledgeBases: (
    botId: string,
    documentVersionIds?: string[]
  ) => Promise<{ success: boolean; error?: unknown }>;
  toggleDocumentOpen: (docId: string) => void;
  handleVersionSelection: (versionId: string, checked: boolean) => void;
  handleDocumentSelection: (documentId: string, checked: boolean) => void;
  clearAllSelections: () => void;
  getDocumentSelectionState: (documentId: string) => boolean | 'indeterminate';
  resetBotState: (botId: string) => void; // 重置特定机器人的状态
  resetStore: () => void; // 完全重置存储（慎用）
  resetDocumentsCache: () => void; // 重置文档缓存（保留当前机器人状态）
}

export const useKnowledgeBaseStore = create<KnowledgeBaseState>((set, get) => ({
  // 状态
  documents: [],
  assignedKnowledgeBases: [],
  selectedVersionIds: [],
  isLoading: false,
  isUpdating: false,
  error: null,
  openDocuments: new Set<string>(),

  // 缓存状态
  documentsLoaded: false,
  loadedBotIds: new Set<string>(),
  currentBotId: null,

  // 获取当前客户端的所有文档和版本
  fetchClientDocuments: async () => {
    // 如果已经加载过文档列表，直接返回
    if (get().documentsLoaded && get().documents.length > 0) {
      console.log('文档列表已缓存，跳过加载');
      return;
    }

    set({ isLoading: true, error: null });
    try {
      console.log('加载客户端文档列表...');
      const documents = await getActiveClientDocuments();
      set({
        documents,
        documentsLoaded: true, // 标记文档已加载
      });
      console.log(`成功加载 ${documents.length} 个文档`);
    } catch (error) {
      console.error('获取客户端文档失败:', error);
      set({ error: error instanceof Error ? error.message : '获取文档列表失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  // 获取机器人已分配的知识库版本
  fetchBotKnowledgeBases: async (botId: string) => {
    if (!botId) return;

    // 如果已经加载过该机器人的知识库，并且当前正在操作该机器人，则跳过
    if (get().loadedBotIds.has(botId) && get().currentBotId === botId) {
      console.log(`机器人 ${botId} 的知识库已缓存，跳过加载`);
      return;
    }

    set({ isLoading: true, error: null, currentBotId: botId });
    try {
      // 获取所有可用文档（如果尚未加载）
      if (!get().documentsLoaded || get().documents.length === 0) {
        await get().fetchClientDocuments();
      }

      console.log(`加载机器人 ${botId} 已分配的知识库...`);
      // 获取机器人已分配的知识库
      const assignedKnowledgeBases = await getBotAssignedKnowledgeBases(botId);

      // 设置已选择的版本ID
      const selectedVersionIds = assignedKnowledgeBases.map(kb => kb.documentVersionId);

      // 更新状态并将该机器人ID添加到已加载列表
      set(state => ({
        assignedKnowledgeBases,
        selectedVersionIds,
        loadedBotIds: new Set([...state.loadedBotIds, botId]),
      }));

      console.log(
        `成功加载机器人 ${botId} 的知识库，关联 ${assignedKnowledgeBases.length} 个知识库版本`
      );
    } catch (error) {
      console.error(`获取机器人 ${botId} 知识库失败:`, error);
      set({ error: error instanceof Error ? error.message : '获取机器人知识库失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  // 更新机器人关联的知识库版本
  updateBotKnowledgeBases: async (botId: string, documentVersionIds?: string[]) => {
    if (!botId) return { success: false, error: 'Bot ID 不能为空' };

    set({ isUpdating: true, error: null });
    try {
      // 如果提供了文档版本IDs参数，使用该参数，否则使用store中的选择状态
      const versionIds = documentVersionIds || get().selectedVersionIds;

      console.log(`更新机器人 ${botId} 知识库，选择了 ${versionIds.length} 个版本`);
      await updateBotKnowledgeBases({
        botId,
        documentVersionIds: versionIds,
      });

      // 更新成功后刷新已分配知识库
      // 从已加载列表中移除该机器人ID，强制下次重新加载
      set(state => ({
        loadedBotIds: new Set([...state.loadedBotIds].filter(id => id !== botId)),
      }));
      await get().fetchBotKnowledgeBases(botId);

      return { success: true };
    } catch (error) {
      console.error('更新机器人知识库失败:', error);
      set({ error: error instanceof Error ? error.message : '更新机器人知识库失败' });
      return { success: false, error };
    } finally {
      set({ isUpdating: false });
    }
  },

  // 切换文档展开/折叠状态
  toggleDocumentOpen: (docId: string) => {
    set(state => {
      const newOpenDocuments = new Set(state.openDocuments);
      if (newOpenDocuments.has(docId)) {
        newOpenDocuments.delete(docId);
      } else {
        newOpenDocuments.add(docId);
      }
      return { openDocuments: newOpenDocuments };
    });
  },

  // 处理版本选择变更
  handleVersionSelection: (versionId: string, checked: boolean) => {
    set(state => {
      let newSelectedIds;
      if (checked) {
        newSelectedIds = [...state.selectedVersionIds, versionId];
      } else {
        newSelectedIds = state.selectedVersionIds.filter(id => id !== versionId);
      }
      return { selectedVersionIds: newSelectedIds };
    });
  },

  // 处理文档的全选/全不选
  handleDocumentSelection: (documentId: string, checked: boolean) => {
    set(state => {
      const document = state.documents.find(d => d.id === documentId);
      if (!document) return state;

      const versionIds = document.versions.map(v => v.id);
      let newSelectedIds;

      if (checked) {
        // 添加所有未选中的版本ID
        const versionIdsToAdd = versionIds.filter(id => !state.selectedVersionIds.includes(id));
        newSelectedIds = [...state.selectedVersionIds, ...versionIdsToAdd];
      } else {
        // 移除所有该文档的版本ID
        newSelectedIds = state.selectedVersionIds.filter(id => !versionIds.includes(id));
      }

      return { selectedVersionIds: newSelectedIds };
    });
  },

  // 清空所有选择
  clearAllSelections: () => {
    set({ selectedVersionIds: [] });
  },

  // 计算文档选中状态
  getDocumentSelectionState: (documentId: string) => {
    const { documents, selectedVersionIds } = get();
    const document = documents.find(d => d.id === documentId);
    if (!document) return false;

    const versionIds = document.versions.map(v => v.id);
    const selectedCount = versionIds.filter(id => selectedVersionIds.includes(id)).length;

    if (selectedCount === 0) return false;
    if (selectedCount === versionIds.length) return true;
    return 'indeterminate';
  },

  // 重置特定机器人的状态（保留文档列表缓存）
  resetBotState: (botId: string) => {
    console.log(`重置机器人 ${botId} 的知识库状态`);
    set(state => ({
      assignedKnowledgeBases: [],
      selectedVersionIds: [],
      error: null,
      openDocuments: new Set<string>(),
      loadedBotIds: new Set([...state.loadedBotIds].filter(id => id !== botId)),
      currentBotId: null,
    }));
  },

  // 完全重置store（慎用，会清除所有缓存）
  resetStore: () => {
    console.log('完全重置知识库存储状态（包括缓存）');
    set({
      documents: [],
      assignedKnowledgeBases: [],
      selectedVersionIds: [],
      error: null,
      openDocuments: new Set<string>(),
      documentsLoaded: false,
      loadedBotIds: new Set<string>(),
      currentBotId: null,
    });
  },

  // 重置文档缓存（保留当前机器人状态）
  resetDocumentsCache: () => {
    console.log('重置文档缓存（保留当前机器人状态）');
    set({
      documents: [],
      documentsLoaded: false,
      loadedBotIds: new Set<string>(),
      // 保留其他状态
    });
  },
}));
