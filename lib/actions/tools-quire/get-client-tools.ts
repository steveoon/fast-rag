'use server';

import { db } from '@/lib/db';
import { client_tools, ClientTool } from '@/lib/db/schema/schema';
import { eq } from 'drizzle-orm';
import { validateClient } from '@/lib/utils';
import { CustomError } from '@/types';

export async function getClientToolsByClientId(apiKey: string): Promise<{
  tools: ClientTool[];
  error: null;
}> {
  try {
    const client = await validateClient(apiKey);
    if (!client) {
      throw new CustomError('非法请求', 'UN_AUTH_REQUEST');
    }

    const tools = await db.select().from(client_tools).where(eq(client_tools.client_id, client.id));

    if (!tools.length) {
      throw new CustomError('未找到客户端工具', 'CLIENT_TOOLS_NOT_FOUND');
    }

    // 类型断言，帮助 TypeScript 理解这是有效的
    return { tools: tools as unknown as ClientTool[], error: null };
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
