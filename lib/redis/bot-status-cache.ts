import { redis } from './';

const BOT_STATUS_PREFIX = 'bot_status:';
const BOT_STATUS_TTL = 60; // 60秒 TTL

export interface BotStatusCache {
  status: 'active' | 'disabled';
  clientId: string;
  updatedAt: string;
}

/**
 * 从缓存获取 Bot 状态
 */
export async function getBotStatusFromCache(botId: string): Promise<BotStatusCache | null> {
  try {
    const result = await redis.hgetall(`${BOT_STATUS_PREFIX}${botId}`);
    if (result && result.status) {
      return {
        status: result.status as 'active' | 'disabled',
        clientId: result.clientId as string,
        updatedAt: result.updatedAt as string,
      };
    }
    return null;
  } catch (error) {
    console.error('Redis bot status cache get error:', error);
    return null;
  }
}

/**
 * 设置 Bot 状态缓存
 */
export async function setBotStatusCache(
  botId: string,
  status: 'active' | 'disabled',
  clientId: string
): Promise<void> {
  try {
    const pipeline = redis.pipeline();
    pipeline.hset(`${BOT_STATUS_PREFIX}${botId}`, {
      status,
      clientId,
      updatedAt: new Date().toISOString(),
    });
    pipeline.expire(`${BOT_STATUS_PREFIX}${botId}`, BOT_STATUS_TTL);
    await pipeline.exec();
  } catch (error) {
    console.error('Redis bot status cache set error:', error);
  }
}

/**
 * 清除 Bot 状态缓存（在状态更新时调用）
 */
export async function invalidateBotStatusCache(botId: string): Promise<void> {
  try {
    await redis.del(`${BOT_STATUS_PREFIX}${botId}`);
  } catch (error) {
    console.error('Redis bot status cache invalidate error:', error);
  }
}
