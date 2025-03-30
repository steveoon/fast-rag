'use server';

import { db } from '../db';
import { chat_bots, clients } from '../db/schema/schema';
import { CustomError } from '@/types';
import { eq } from 'drizzle-orm';

/**
 * 更新聊天机器人状态
 */
export async function updateChatBotStatus(
  chatbotId: string,
  status: 'active' | 'disabled',
  userId: string
) {
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

  // 更新状态
  const [updatedChatbot] = await db
    .update(chat_bots)
    .set({
      status,
      updated_at: new Date().toISOString(),
    })
    .where(eq(chat_bots.id, chatbotId))
    .returning();

  if (!updatedChatbot) {
    throw new CustomError('更新聊天机器人状态失败', 'CHATBOT_STATUS_UPDATE_FAILED');
  }

  return { chatbot: updatedChatbot };
}
