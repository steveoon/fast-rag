import { redis } from './';

const API_KEY_PREFIX = 'api_key:';
const CLIENT_PREFIX = 'client:';

export async function cacheApiKey(apiKey: string, clientId: string, status: string): Promise<void> {
  const pipeline = redis.pipeline();
  const [prefix, secret, signature] = apiKey.split('.');

  // 删除旧的API密钥（如果存在）
  const oldApiKey = await redis.get(`${CLIENT_PREFIX}${clientId}`);
  if (oldApiKey) {
    pipeline.del(`${API_KEY_PREFIX}${oldApiKey}`);
  }

  // 设置新的API密钥
  pipeline.hset(`${API_KEY_PREFIX}${apiKey}`, {
    clientId,
    status,
    prefix,
    secret,
    signature,
  });

  // 更新客户端的API密钥引用
  pipeline.set(`${CLIENT_PREFIX}${clientId}`, apiKey);

  await pipeline.exec();
}

export async function getApiKeyInfoFromCache(apiKey: string): Promise<{
  clientId: string;
  status: string;
  prefix: string;
  secret: string;
  signature: string;
} | null> {
  const result = await redis.hgetall(`${API_KEY_PREFIX}${apiKey}`);
  return result
    ? {
        clientId: result.clientId as string,
        status: result.status as string,
        prefix: result.prefix as string,
        secret: result.secret as string,
        signature: result.signature as string,
      }
    : null;
}

export async function removeApiKeyFromCache(apiKey: string): Promise<void> {
  const clientId = await redis.hget(`${API_KEY_PREFIX}${apiKey}`, 'clientId');
  if (clientId) {
    await redis.del(`${CLIENT_PREFIX}${clientId}`);
  }
  await redis.del(`${API_KEY_PREFIX}${apiKey}`);
}

export async function getClientApiKey(clientId: string): Promise<string | null> {
  return redis.get(`${CLIENT_PREFIX}${clientId}`);
}

// 设置用户当前活跃客户端
export async function setUserActiveClient(userId: string, clientId: string): Promise<void> {
  await redis.set(`user:${userId}:active_client`, clientId);
}

// 获取用户当前活跃客户端
export async function getUserActiveClient(userId: string): Promise<string | null> {
  return redis.get(`user:${userId}:active_client`);
}

// 获取用户当前活跃客户端的API Key
export async function getUserActiveApiKey(userId: string): Promise<string | null> {
  const activeClientId = await getUserActiveClient(userId);
  if (!activeClientId) return null;
  return getClientApiKey(activeClientId);
}
