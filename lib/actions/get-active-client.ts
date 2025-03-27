'use server';

import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { clients } from '@/lib/db/schema/schema';
import { createClient } from '@/lib/utils/supabase/server';
import { CustomError } from '@/types';
import { handleError } from '@/lib/utils/error';
import { getUserActiveClient } from '@/lib/redis/api-key-cache';

export interface ClientInfo {
  id: string;
  name: string;
  status: string;
}

/**
 * 获取当前用户活跃的客户端信息
 * 可以在任何server component中使用
 */
export async function getActiveClientInfo(): Promise<ClientInfo> {
  try {
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.getUser();

    if (authError) {
      throw new CustomError('认证失败', 'AUTH_ERROR', authError.message);
    }

    const user = data?.user;
    if (!user) {
      throw new CustomError('用户未登录', 'UNAUTHORIZED');
    }

    // 获取当前活跃客户端ID
    const activeClientId = await getUserActiveClient(user.id);
    if (!activeClientId) {
      throw new CustomError('未找到活跃客户端', 'NO_ACTIVE_CLIENT');
    }

    // 从数据库获取客户端详细信息
    const clientInfo = await db.query.clients.findFirst({
      where: eq(clients.id, activeClientId),
      columns: {
        id: true,
        name: true,
        status: true,
      },
    });

    if (!clientInfo) {
      throw new CustomError('客户端不存在', 'CLIENT_NOT_FOUND');
    }

    return clientInfo;
  } catch (error) {
    const formattedError = handleError(error);
    throw new CustomError(formattedError.message, formattedError.code, formattedError.details);
  }
}
