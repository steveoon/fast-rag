'use server';
import { db } from '../db';
import { generateAPIKey } from '../api-key/generate-key';
import { clients, Client, access_tokens, AccessToken } from '../db/schema/schema';
import { isClientNameUnique } from '../utils';
import { CustomError } from '@/types';
import { eq } from 'drizzle-orm';
import { cacheApiKey } from '../redis/api-key-cache';
import { setUserActiveClient } from '../redis/api-key-cache';
export async function createClientWithApiKey(
  clientName: string,
  userId: string,
  tokenDescription?: string
): Promise<{ client: Client; apiKey: string; accessToken: AccessToken }> {
  // 验证 clientName 格式
  const clientNameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!clientNameRegex.test(clientName)) {
    throw new CustomError(
      '客户端名称格式无效，只能包含英文、数字、下划线和短横线',
      'INVALID_CLIENT_NAME_FORMAT'
    );
  }

  // 检查 clientName 是否唯一
  if (!(await isClientNameUnique(clientName))) {
    throw new CustomError('客户端名称已存在', 'CLIENT_NAME_ALREADY_EXISTS');
  }

  const transactionResult = await db.transaction(async tx => {
    // 创建客户端
    const [newClient] = await tx
      .insert(clients)
      .values({
        name: clientName,
        status: 'active',
        user_id: userId,
      })
      .returning();

    if (!newClient) {
      throw new CustomError('创建客户端失败', 'CLIENT_CREATION_FAILED');
    }

    // 生成 API Key
    const apiKey = generateAPIKey(newClient.id);
    await tx.update(clients).set({ api_key: apiKey.fullKey }).where(eq(clients.id, newClient.id));

    // 创建访问令牌
    const [newToken] = await tx
      .insert(access_tokens)
      .values({
        client_id: newClient.id,
        token: apiKey.fullKey,
        description: tokenDescription,
        status: 'active',
        expires_at: apiKey.expiresAt?.toISOString() ?? null,
      })
      .returning();

    if (!newToken) {
      throw new CustomError('创建访问令牌失败', 'ACCESS_TOKEN_CREATION_FAILED');
    }

    return {
      client: newClient,
      apiKey: apiKey.fullKey,
      accessToken: newToken,
    };
  });

  // 并发执行 Redis 缓存更新
  await Promise.all([
    cacheApiKey(
      transactionResult.accessToken.token,
      transactionResult.client.id,
      transactionResult.accessToken.status
    ),
    setUserActiveClient(userId, transactionResult.client.id),
  ]);

  return transactionResult;
}
