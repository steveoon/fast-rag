'use server';

import { db } from '@/lib/db';
import { tools, tool_parameters, ToolParameter, Tool } from '@/lib/db/schema/schema';
import { eq, asc } from 'drizzle-orm';
import { cache } from 'react';

// 这是我们期望的完整类型，包括参数
export type ToolWithParameters = Tool & {
  parameters: ToolParameter[];
};

/**
 * 获取所有公共可用的工具列表
 */
export const getPublicTools = cache(async () => {
  try {
    // 查询所有公共可用的工具
    const toolsData = await db
      .select()
      .from(tools)
      .where(eq(tools.is_public, true))
      .orderBy(asc(tools.name));

    // 手动查询每个工具的参数
    const toolsWithParams = [];

    for (const tool of toolsData) {
      const params = await db
        .select()
        .from(tool_parameters)
        .where(eq(tool_parameters.tool_id, tool.id));

      toolsWithParams.push({
        ...tool,
        parameters: params,
      });
    }

    return { tools: toolsWithParams as ToolWithParameters[], error: null };
  } catch (error) {
    console.error('获取工具列表失败:', error);
    return { tools: [] as ToolWithParameters[], error: '获取工具列表失败' };
  }
});

/**
 * 根据ID获取单个工具的详细信息
 */
export const getToolById = cache(async (toolId: string) => {
  try {
    const tool = await db.select().from(tools).where(eq(tools.id, toolId)).limit(1);

    if (tool.length === 0) {
      return { tool: null, error: '工具不存在' };
    }

    const params = await db
      .select()
      .from(tool_parameters)
      .where(eq(tool_parameters.tool_id, toolId));

    const toolWithParams = {
      ...tool[0],
      parameters: params,
    };

    return { tool: toolWithParams as ToolWithParameters, error: null };
  } catch (error) {
    console.error(`获取工具(ID: ${toolId})信息失败:`, error);
    return { tool: null, error: '获取工具信息失败' };
  }
});
