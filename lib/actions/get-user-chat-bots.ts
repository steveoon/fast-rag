'use server';

import { db } from '../db';
import {
  chat_bots,
  clients,
  chat_bot_tools,
  client_tools,
  tools,
  Chatbot,
} from '../db/schema/schema';
import { eq, inArray } from 'drizzle-orm';
import { getUserActiveClient } from '@/lib/redis/api-key-cache';

/**
 * 根据客户端ID获取聊天机器人列表
 */
export async function getChatBotsByClientId(clientId: string) {
  // 获取客户端关联的聊天机器人
  const chatBots = await db.select().from(chat_bots).where(eq(chat_bots.client_id, clientId));

  return await enrichChatBotsWithTools(chatBots);
}

/**
 * 获取用户所有的聊天机器人
 */
export async function getUserChatBots(userId: string) {
  // 尝试获取当前激活的客户端ID
  const activeClientId = await getUserActiveClient(userId);

  // 如果有激活的客户端ID，使用客户端ID查询
  if (activeClientId) {
    try {
      return await getChatBotsByClientId(activeClientId);
    } catch (error) {
      console.error('通过激活客户端ID获取机器人失败，回退到用户ID查询', error);
      // 如果通过激活客户端ID查询失败，回退到通过用户ID查询
    }
  }

  // 通过用户ID查询所有客户端及其机器人
  // 获取用户的所有客户端ID
  const userClients = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.user_id, userId));
  const clientIds = userClients.map(client => client.id);

  if (clientIds.length === 0) {
    return [];
  }

  // 获取用户所有客户端关联的聊天机器人
  const chatBots = await db.select().from(chat_bots).where(inArray(chat_bots.client_id, clientIds));

  return await enrichChatBotsWithTools(chatBots);
}

/**
 * 为机器人数据添加工具配置信息
 */
async function enrichChatBotsWithTools(chatBots: Chatbot[]) {
  // 获取聊天机器人关联的客户端工具
  const result = [];

  for (const chatBot of chatBots) {
    const chatBotTools = await db
      .select({
        chat_bot_tool: chat_bot_tools,
        client_tool: client_tools,
        tool: tools,
      })
      .from(chat_bot_tools)
      .innerJoin(client_tools, eq(chat_bot_tools.client_tool_id, client_tools.id))
      .innerJoin(tools, eq(client_tools.tool_id, tools.id))
      .where(eq(chat_bot_tools.chat_bot_id, chatBot.id));

    const clientToolsConfig = chatBotTools.map(({ chat_bot_tool, client_tool, tool }) => ({
      client_tool_id: client_tool.id,
      tool_id: tool.id,
      tool_name: tool.name,
      config: chat_bot_tool.config || client_tool.config,
    }));

    result.push({
      ...chatBot,
      client_tools_config: clientToolsConfig,
    });
  }

  return result;
}
