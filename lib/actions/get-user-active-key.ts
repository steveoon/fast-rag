'use server';

import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { clients } from '@/lib/db/schema/schema';
import { createClient } from '@/lib/utils/supabase/server';
import { CustomError } from '@/types';
import { handleError } from '@/lib/utils/error';
import {
  getUserActiveClient,
  getClientApiKey,
  setUserActiveClient,
} from '@/lib/redis/api-key-cache';

export async function getUserActiveKey(): Promise<string> {
  try {
    // 创建Supabase客户端并获取用户信息
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.getUser();

    // 身份验证错误处理
    if (authError) {
      throw new CustomError('认证失败', 'AUTH_ERROR', authError.message);
    }

    const user = data?.user;
    if (!user) {
      throw new CustomError('用户未登录', 'UNAUTHORIZED');
    }

    // 尝试从缓存获取API密钥
    const cachedApiKey = await tryGetCachedApiKey(user.id);
    if (cachedApiKey) return cachedApiKey;

    // 如果缓存中没有，从数据库获取并更新缓存
    return await getFallbackKeyAndUpdateCache(user.id);
  } catch (error) {
    const formattedError = handleError(error);
    throw new CustomError(formattedError.message, formattedError.code, formattedError.details);
  }
}

/**
 * 尝试从缓存中获取API密钥
 */
async function tryGetCachedApiKey(userId: string): Promise<string | null> {
  const activeClientId = await getUserActiveClient(userId);
  if (!activeClientId) return null;

  return (await getClientApiKey(activeClientId)) || null;
}

/**
 * 从数据库获取备用密钥并更新缓存
 */
async function getFallbackKeyAndUpdateCache(userId: string): Promise<string> {
  const fallbackClient = await db.query.clients.findFirst({
    where: eq(clients.user_id, userId),
    columns: {
      id: true,
      api_key: true,
    },
    orderBy: (clients, { desc }) => [desc(clients.created_at)],
  });

  if (!fallbackClient?.api_key) {
    throw new CustomError('未找到可用的API密钥', 'NO_ACTIVE_KEY');
  }

  // 更新缓存
  if (fallbackClient.id) {
    // 使用void操作符避免阻塞主流程，因为我们不需要等待缓存更新完成
    void setUserActiveClient(userId, fallbackClient.id);
  }

  return fallbackClient.api_key;
}
