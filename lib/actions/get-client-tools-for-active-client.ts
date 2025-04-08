'use server';

import { db } from '@/lib/db';
import { client_tools, tools } from '@/lib/db/schema/schema';
import { eq, and } from 'drizzle-orm';
import { getUserActiveClient } from '@/lib/redis/api-key-cache';
import { CustomError } from '@/types';

// 定义工具信息类型，增加client_id和is_enabled字段
export type ToolInfo = {
  id: string; // client_tools的ID
  toolId: string; // 工具的实际ID
  name: string; // 工具名称
  client_id: string; // 客户端ID
  is_enabled: boolean; // 工具是否启用
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

    // 查询工具详情，包含client_id和is_enabled字段，并过滤出已启用的工具
    const toolsData = await db
      .select({
        id: client_tools.id, // client_tools的ID
        toolId: tools.id, // 工具的实际ID
        name: tools.name, // 工具名称
        client_id: client_tools.client_id, // 客户端ID
        is_enabled: client_tools.is_enabled, // 工具是否启用
      })
      .from(client_tools)
      .innerJoin(tools, eq(client_tools.tool_id, tools.id))
      .where(and(eq(client_tools.client_id, activeClientId), eq(client_tools.is_enabled, true)));

    console.log(`找到 ${toolsData.length} 个已启用的工具，客户端ID: ${activeClientId}`);

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
