'use server';
import { db } from '../db';
import { clients, access_tokens } from '../db/schema/schema';
import { eq, and, not } from 'drizzle-orm';
import { CustomError } from '@/types';
import { cacheApiKey } from '../redis/api-key-cache';
import { setUserActiveClient } from '../redis/api-key-cache';

export async function setActiveToken(
  clientId: string,
  tokenId: string,
  userId: string
): Promise<void> {
  await db.transaction(async tx => {
    // 并行查询客户端和令牌信息
    const [clientResult, tokenResult] = await Promise.all([
      tx.select().from(clients).where(eq(clients.id, clientId)).limit(1),
      tx
        .select()
        .from(access_tokens)
        .where(and(eq(access_tokens.id, tokenId), eq(access_tokens.client_id, clientId)))
        .limit(1),
    ]);

    const [client] = clientResult;
    const [token] = tokenResult;

    if (!client) {
      throw new CustomError('客户端不存在', 'CLIENT_NOT_FOUND');
    }

    if (!token) {
      throw new CustomError('无效的访问令牌', 'INVALID_ACCESS_TOKEN');
    }

    // 并行执行数据库更新操作
    await Promise.all([
      // 将所有其他令牌设置为非活动状态
      tx
        .update(access_tokens)
        .set({ status: 'inactive' })
        .where(and(eq(access_tokens.client_id, clientId), not(eq(access_tokens.id, tokenId)))),

      // 将选定的令牌设置为活动状态
      tx.update(access_tokens).set({ status: 'active' }).where(eq(access_tokens.id, tokenId)),

      // 更新客户端的 api_key
      tx.update(clients).set({ api_key: token.token }).where(eq(clients.id, clientId)),
    ]);

    // 并行执行 Redis 缓存操作
    await Promise.all([
      // 缓存新的 API key 到 Redis
      cacheApiKey(token.token, clientId, 'active'),

      // 设置为用户活跃客户端
      setUserActiveClient(userId, clientId),
    ]);
  });
}
