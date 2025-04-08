import { create } from 'zustand';
import { getUserChatBots } from '@/lib/actions/get-user-chat-bots';
import { createChatBot } from '@/lib/actions/create-chat-bot';
import { updateChatBot } from '@/lib/actions/update-chat-bot';
import { updateChatBotStatus } from '@/lib/actions/update-chat-bot-status';
import { deleteChatBot } from '@/lib/actions/delete-chat-bot';
import { Chatbot } from '@/lib/db/schema/schema';

// 定义类型
type ClientToolConfig = {
  client_tool_id: string;
  tool_id: string;
  tool_name: string;
  config: Record<string, unknown>;
};

type ExtendedChatbot = Chatbot & {
  client_tools_config?: Array<ClientToolConfig> | string;
};

type ChatbotWithUrl = ExtendedChatbot & {
  fullUrl: string;
};

interface ChatBotCreateData {
  name: string;
  description: string;
  clientToolIds: string[];
}

interface ChatBotUpdateData extends ChatBotCreateData {
  id: string;
}

interface ChatBotsState {
  chatbots: ChatbotWithUrl[];
  selectedChatbot: ExtendedChatbot | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;

  fetchChatBots: (userId: string) => Promise<void>;
  createChatBot: (data: ChatBotCreateData, userId: string) => Promise<void>;
  updateChatBot: (data: ChatBotUpdateData, userId: string) => Promise<void>;
  toggleChatBotStatus: (chatbotId: string, userId: string) => Promise<void>;
  deleteChatBot: (chatbotId: string, userId: string) => Promise<void>;
  selectChatbot: (chatbot: ExtendedChatbot | null) => void;
  setChatBots: (chatbots: ExtendedChatbot[]) => void;
}

export const useChatBotsStore = create<ChatBotsState>((set, get) => ({
  // 状态
  chatbots: [],
  selectedChatbot: null,
  isLoading: false,
  isUpdating: false,
  error: null,

  // 操作方法
  fetchChatBots: async userId => {
    set({ isLoading: true, error: null });
    try {
      const chatbots = await getUserChatBots(userId);
      set({
        chatbots: chatbots.map(bot => ({
          ...bot,
          fullUrl: typeof window !== 'undefined' ? `${window.location.origin}${bot.url}` : '',
        })) as ChatbotWithUrl[],
      });
    } catch (error) {
      console.error('刷新聊天机器人列表失败:', error);
      set({ error: error instanceof Error ? error.message : '获取机器人列表失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  createChatBot: async (data, userId) => {
    set({ isUpdating: true, error: null });
    try {
      await createChatBot({
        name: data.name,
        description: data.description,
        clientToolIds: data.clientToolIds,
        userId,
      });

      // 创建成功后刷新列表
      await get().fetchChatBots(userId);
    } catch (error) {
      console.error('创建聊天机器人失败:', error);
      set({ error: error instanceof Error ? error.message : '创建机器人失败' });
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  updateChatBot: async (data, userId) => {
    set({ isUpdating: true, error: null });
    try {
      await updateChatBot({
        id: data.id,
        name: data.name,
        description: data.description,
        clientToolIds: data.clientToolIds,
        userId,
      });

      // 更新成功后刷新列表
      await get().fetchChatBots(userId);
      set({ selectedChatbot: null });
    } catch (error) {
      console.error('更新聊天机器人失败:', error);
      set({ error: error instanceof Error ? error.message : '更新机器人失败' });
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  toggleChatBotStatus: async (chatbotId, userId) => {
    const chatbots = get().chatbots;
    const chatbot = chatbots.find(bot => bot.id === chatbotId);
    if (!chatbot) return;

    set({ isUpdating: true, error: null });
    try {
      const newStatus = chatbot.status === 'active' ? 'disabled' : 'active';
      await updateChatBotStatus(chatbotId, newStatus, userId);

      // 更新本地状态
      set({
        chatbots: chatbots.map(bot => (bot.id === chatbotId ? { ...bot, status: newStatus } : bot)),
      });
    } catch (error) {
      console.error('更新聊天机器人状态失败:', error);
      set({ error: error instanceof Error ? error.message : '更新机器人状态失败' });
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  deleteChatBot: async (chatbotId, userId) => {
    set({ isUpdating: true, error: null });
    try {
      await deleteChatBot(chatbotId, userId);

      // 删除成功后更新列表
      set({
        chatbots: get().chatbots.filter(bot => bot.id !== chatbotId),
      });
    } catch (error) {
      console.error('删除聊天机器人失败:', error);
      set({ error: error instanceof Error ? error.message : '删除机器人失败' });
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  selectChatbot: chatbot => {
    set({ selectedChatbot: chatbot });
  },

  // 实现 setChatBots 方法
  setChatBots: chatbots => {
    set({
      chatbots: chatbots.map(bot => ({
        ...bot,
        fullUrl: typeof window !== 'undefined' ? `${window.location.origin}${bot.url}` : '',
      })) as ChatbotWithUrl[],
      isLoading: false,
    });
  },
}));
