'use server';

import { db } from '../db';
import { chat_bots, clients, chat_bot_tools } from '../db/schema/schema';
import { CustomError } from '@/types';
import { eq, and, ne } from 'drizzle-orm';

export async function updateChatBot({
  id,
  name,
  description,
  clientToolIds,
  userId,
}: {
  id: string;
  name: string;
  description: string;
  clientToolIds: string[];
  userId: string;
}) {
  // 验证 name 格式
  const nameRegex = /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/;
  if (!nameRegex.test(name)) {
    throw new CustomError(
      '机器人名称格式无效，只能包含中英文、数字、下划线和短横线',
      'INVALID_CHATBOT_NAME_FORMAT'
    );
  }

  // 查找要更新的聊天机器人
  const chatbot = await db.select().from(chat_bots).where(eq(chat_bots.id, id)).limit(1);

  if (chatbot.length === 0) {
    throw new CustomError('机器人不存在', 'CHATBOT_NOT_FOUND');
  }

  // 确认聊天机器人属于当前用户
  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.id, chatbot[0].client_id))
    .limit(1);

  if (client.length === 0 || client[0].user_id !== userId) {
    throw new CustomError('无权访问此机器人', 'UNAUTHORIZED_CHATBOT_ACCESS');
  }

  // 检查机器人名称在同一客户端下是否与其他机器人冲突
  if (name !== chatbot[0].name) {
    const existingChatbot = await db
      .select()
      .from(chat_bots)
      .where(
        and(
          eq(chat_bots.name, name),
          eq(chat_bots.client_id, chatbot[0].client_id),
          ne(chat_bots.id, id)
        )
      )
      .limit(1);

    if (existingChatbot.length > 0) {
      throw new CustomError('机器人名称已存在', 'CHATBOT_NAME_ALREADY_EXISTS');
    }
  }

  // 更新聊天机器人
  const [updatedChatbot] = await db
    .update(chat_bots)
    .set({
      name,
      description,
      updated_at: new Date().toISOString(),
    })
    .where(eq(chat_bots.id, id))
    .returning();

  if (!updatedChatbot) {
    throw new CustomError('更新机器人失败', 'CHATBOT_UPDATE_FAILED');
  }

  // 更新工具关联
  // 先删除现有关联
  await db.delete(chat_bot_tools).where(eq(chat_bot_tools.chat_bot_id, id));

  // 添加新的工具关联
  if (clientToolIds.length > 0) {
    const chatBotToolsValues = clientToolIds.map(clientToolId => ({
      chat_bot_id: id,
      client_tool_id: clientToolId,
      config: {},
    }));

    await db.insert(chat_bot_tools).values(chatBotToolsValues);
  }

  return { chatbot: updatedChatbot };
}
