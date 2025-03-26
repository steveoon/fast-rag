'use server';

import { db } from '@/lib/db';
import { client_tools } from '@/lib/db/schema/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { validateClient } from '@/lib/utils';
import { CustomError } from '@/types';

export async function applyClientTools(
  apiKey: string,
  toolIds: string[]
): Promise<{
  success: boolean;
  message: string;
  toolNumber: number;
  appliedToolIds: string[];
}> {
  try {
    if (!toolIds.length) {
      throw new CustomError('未选择任何工具', 'NO_TOOLS_SELECTED');
    }

    const client = await validateClient(apiKey);
    if (!client) {
      throw new CustomError('非法请求', 'UN_AUTH_REQUEST');
    }

    // 查询已经存在的工具关联
    const existingTools = await db
      .select({ tool_id: client_tools.tool_id })
      .from(client_tools)
      .where(and(eq(client_tools.client_id, client.id), inArray(client_tools.tool_id, toolIds)));

    // 过滤出尚未关联的工具IDs
    const existingToolIds = existingTools.map(tool => tool.tool_id);
    const newToolIds = toolIds.filter(id => !existingToolIds.includes(id));

    if (newToolIds.length === 0) {
      throw new CustomError('所选工具已全部应用', 'TOOLS_ALREADY_APPLIED');
    }

    // 批量插入新的工具关联
    const insertData = newToolIds.map(toolId => ({
      client_id: client.id,
      tool_id: toolId,
      is_enabled: true,
    }));

    await db.insert(client_tools).values(insertData);

    return {
      success: true,
      toolNumber: newToolIds.length,
      message: `成功应用 ${newToolIds.length} 个工具`,
      appliedToolIds: newToolIds,
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }

    console.error('应用工具失败:', error);
    throw new CustomError(
      '应用工具失败',
      'APPLY_TOOLS_FAILED',
      error instanceof Error ? error.message : undefined
    );
  }
}
