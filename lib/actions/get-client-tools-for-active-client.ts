'use server';

import { db } from '@/lib/db';
import { client_tools, tools } from '@/lib/db/schema/schema';
import { eq } from 'drizzle-orm';
import { getUserActiveClient } from '@/lib/redis/api-key-cache';
import { CustomError } from '@/types';

// 定义工具信息类型
export type ToolInfo = {
  id: string;
  name: string;
};

/**
 * 获取当前活跃客户端关联的工具列表
 * 在服务端调用，不会将clientId暴露给前端
 */
export async function getToolsForActiveClient(userId: string): Promise<{
  tools: ToolInfo[];
  hasActiveClient: boolean;
}> {
  try {
    // 从缓存中获取当前活跃的客户端ID
    const activeClientId = await getUserActiveClient(userId);

    // 如果没有活跃的客户端，返回空数组和状态标记
    if (!activeClientId) {
      return { tools: [], hasActiveClient: false };
    }

    // 直接查询工具详情，确保每个工具只出现一次
    const toolsData = await db
      .select({
        id: client_tools.id, // 使用client_tools的ID作为标识符
        toolId: tools.id, // 工具的实际ID，用于去重
        name: tools.name,
      })
      .from(client_tools)
      .innerJoin(tools, eq(client_tools.tool_id, tools.id))
      .where(eq(client_tools.client_id, activeClientId));

    return {
      tools: toolsData,
      hasActiveClient: true,
    };
  } catch (error) {
    console.error('获取工具列表失败:', error);
    throw new CustomError(
      '获取工具列表失败',
      'FETCH_TOOLS_FAILED',
      error instanceof Error ? error.message : undefined
    );
  }
}
