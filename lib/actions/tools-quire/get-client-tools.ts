'use server';

import { db } from '@/lib/db';
import {
  client_tools,
  ClientTool,
  tools,
  tool_parameters,
  ToolParameter,
} from '@/lib/db/schema/schema';
import { eq, inArray } from 'drizzle-orm';
import { validateClient } from '@/lib/utils';
import { CustomError } from '@/types';

export type ClientToolWithDetails = ClientTool & {
  tool: {
    id: string;
    name: string;
    display_name: string;
    description: string;
    icon: string | null;
    status: 'active' | 'deprecated' | 'disabled';
    version: string;
    implementation_key: string;
    parameters: ToolParameter[];
  };
};

export async function getClientToolsByClientId(apiKey: string): Promise<{
  tools: ClientToolWithDetails[];
  error: null;
}> {
  try {
    const client = await validateClient(apiKey);
    if (!client) {
      throw new CustomError('非法请求', 'UN_AUTH_REQUEST');
    }

    // 查询客户端工具关联表
    const clientTools = await db
      .select()
      .from(client_tools)
      .where(eq(client_tools.client_id, client.id));

    // 如果未找到工具，返回空数组而不是抛出错误
    if (!clientTools.length) {
      return { tools: [], error: null };
    }

    // 获取关联的工具ID
    const toolIds = clientTools.map(ct => ct.tool_id);

    // 查询工具详情
    const toolsData = await db.select().from(tools).where(inArray(tools.id, toolIds));

    // 查询工具参数
    const toolParams = await db
      .select()
      .from(tool_parameters)
      .where(inArray(tool_parameters.tool_id, toolIds));

    // 将参数信息组织到对应工具下
    const toolsWithParams = toolsData.map(tool => {
      const params = toolParams.filter(param => param.tool_id === tool.id);
      return {
        ...tool,
        parameters: params,
      };
    });

    // 组合客户端工具与工具详情
    const clientToolsWithDetails = clientTools
      .map(clientTool => {
        const toolDetail = toolsWithParams.find(t => t.id === clientTool.tool_id);

        return {
          ...clientTool,
          tool: toolDetail
            ? {
                id: toolDetail.id,
                name: toolDetail.name,
                display_name: toolDetail.display_name,
                description: toolDetail.description,
                icon: toolDetail.icon,
                status: toolDetail.status,
                version: toolDetail.version,
                implementation_key: toolDetail.implementation_key,
                parameters: toolDetail.parameters || [],
              }
            : undefined,
        };
      })
      .filter(item => item.tool !== undefined) as ClientToolWithDetails[];

    return { tools: clientToolsWithDetails, error: null };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }

    console.error('获取客户端工具失败:', error);
    throw new CustomError(
      '获取客户端工具失败',
      'FETCH_CLIENT_TOOLS_FAILED',
      error instanceof Error ? error.message : undefined
    );
  }
}
