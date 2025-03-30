'use server';

import { db } from '../db';
import { chat_bots, clients, chat_bot_tools } from '../db/schema/schema';
import { CustomError } from '@/types';
import { eq } from 'drizzle-orm';

/**
 * 删除聊天机器人
 */
export async function deleteChatBot(chatbotId: string, userId: string) {
  // 获取聊天机器人信息
  const chatbot = await db.select().from(chat_bots).where(eq(chat_bots.id, chatbotId)).limit(1);

  if (chatbot.length === 0) {
    throw new CustomError('聊天机器人不存在', 'CHATBOT_NOT_FOUND');
  }

  // 确认聊天机器人属于当前用户
  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.id, chatbot[0].client_id))
    .limit(1);

  if (client.length === 0 || client[0].user_id !== userId) {
    throw new CustomError('无权访问此聊天机器人', 'UNAUTHORIZED_CHATBOT_ACCESS');
  }

  // 删除聊天机器人关联的工具
  await db.delete(chat_bot_tools).where(eq(chat_bot_tools.chat_bot_id, chatbotId));

  // 删除聊天机器人
  const [deletedChatbot] = await db
    .delete(chat_bots)
    .where(eq(chat_bots.id, chatbotId))
    .returning();

  if (!deletedChatbot) {
    throw new CustomError('删除聊天机器人失败', 'CHATBOT_DELETE_FAILED');
  }

  return { chatbot: deletedChatbot };
}
