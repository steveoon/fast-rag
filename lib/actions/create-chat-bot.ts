'use server';

import { db } from '../db';
import { chat_bots, clients, chat_bot_tools } from '../db/schema/schema';
import { CustomError } from '@/types';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getUserActiveClient } from '@/lib/redis/api-key-cache';

export async function createChatBot({
  name,
  description,
  clientToolIds,
  userId,
}: {
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

  // 获取当前活跃的客户端ID
  const activeClientId = await getUserActiveClient(userId);
  if (!activeClientId) {
    throw new CustomError('未找到活跃的客户端', 'NO_ACTIVE_CLIENT');
  }

  // 检查 clientId 是否属于当前用户
  const client = await db.select().from(clients).where(eq(clients.id, activeClientId)).limit(1);

  if (client.length === 0) {
    throw new CustomError('客户端不存在', 'CLIENT_NOT_FOUND');
  }

  if (client[0].user_id !== userId) {
    throw new CustomError('无权访问此客户端', 'UNAUTHORIZED_CLIENT_ACCESS');
  }

  // 检查机器人名称在同一客户端下是否唯一
  const existingChatbot = await db
    .select()
    .from(chat_bots)
    .where(and(eq(chat_bots.name, name), eq(chat_bots.client_id, activeClientId)))
    .limit(1);

  if (existingChatbot.length > 0) {
    throw new CustomError('机器人名称已存在', 'CHATBOT_NAME_ALREADY_EXISTS');
  }

  const chatbotId = randomUUID();
  const chatbotUrl = `/chat-bot/${chatbotId}`;

  // 创建聊天机器人
  const [newChatbot] = await db
    .insert(chat_bots)
    .values({
      id: chatbotId,
      name,
      description,
      client_id: activeClientId,
      status: 'disabled', // 默认为停用状态
      url: chatbotUrl,
    })
    .returning();

  if (!newChatbot) {
    throw new CustomError('创建机器人失败', 'CHATBOT_CREATION_FAILED');
  }

  // 如果有工具，则为机器人关联工具
  if (clientToolIds.length > 0) {
    const chatBotToolsValues = clientToolIds.map(clientToolId => ({
      chat_bot_id: chatbotId,
      client_tool_id: clientToolId,
      config: {},
    }));

    await db.insert(chat_bot_tools).values(chatBotToolsValues);
  }

  return { chatbot: newChatbot };
}
