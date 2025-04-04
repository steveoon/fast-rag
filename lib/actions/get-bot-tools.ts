'use server';

import { db } from '@/lib/db';
import { chat_bot_tools, client_tools, tools } from '@/lib/db/schema/schema';
import { eq, and } from 'drizzle-orm';
import { redis } from '@/lib/redis';

// 定义类型别名避免重复使用Record<string, unknown>
type JsonObject = Record<string, unknown>;

interface ToolInfo {
  name: string;
  displayName: string;
  description: string;
  implementationKey: string;
  icon: string | null;
  version: string;
  toolId: string;
  clientToolId: string;
  clientConfig: JsonObject | null;
  botConfig: JsonObject | null;
  isEnabled: boolean;
  config: JsonObject;
}

export async function getBotTools(botId: string): Promise<ToolInfo[]> {
  // 尝试从缓存获取
  const cacheKey = `bot_tools:${botId}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached && typeof cached === 'string') {
      try {
        return JSON.parse(cached) as ToolInfo[];
      } catch (parseError) {
        console.error('Failed to parse cached data:', parseError);
        // 缓存数据解析失败，删除无效缓存
        await redis.del(cacheKey);
      }
    }
  } catch (error) {
    // 缓存错误不应影响主要功能，仅记录错误
    console.error('Redis cache error:', error);
  }

  // 查询数据库获取工具信息
  const toolsInfo = await db
    .select({
      // 基础工具信息
      name: tools.name,
      displayName: tools.display_name,
      description: tools.description,
      implementationKey: tools.implementation_key,
      icon: tools.icon,
      version: tools.version,

      // ID 引用
      toolId: tools.id,
      clientToolId: client_tools.id,

      // 配置信息
      clientConfig: client_tools.config,
      botConfig: chat_bot_tools.config,

      // 状态信息
      isEnabled: client_tools.is_enabled,
    })
    .from(chat_bot_tools)
    .innerJoin(client_tools, eq(chat_bot_tools.client_tool_id, client_tools.id))
    .innerJoin(tools, eq(client_tools.tool_id, tools.id))
    .where(
      and(
        eq(chat_bot_tools.chat_bot_id, botId),
        eq(client_tools.is_enabled, true) // 只获取已启用的工具
      )
    );

  // 处理结果：合并配置
  const processedTools = toolsInfo.map(tool => {
    const clientConfigObj = tool.clientConfig as JsonObject | null;
    const botConfigObj = tool.botConfig as JsonObject | null;

    return {
      ...tool,
      clientConfig: clientConfigObj,
      botConfig: botConfigObj,
      // 合并配置，botConfig会覆盖clientConfig中相同的键
      config: {
        ...(clientConfigObj || {}),
        ...(botConfigObj || {}),
      },
    } as ToolInfo;
  });

  // 将结果存入缓存
  if (processedTools.length > 0) {
    try {
      const jsonString = JSON.stringify(processedTools);
      // 确保我们能够解析回来以验证JSON格式正确
      JSON.parse(jsonString);

      // 使用 setex 设置缓存
      await redis.setex(cacheKey, 1800, jsonString);
    } catch (error) {
      // 缓存错误不影响主要功能
      console.error('Redis cache serialization error:', error);
    }
  }

  return processedTools;
}
