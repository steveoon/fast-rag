import { db } from '@/lib/db';
import { chat_bots } from '@/lib/db/schema/schema';
import { eq } from 'drizzle-orm';
import { getBotStatusFromCache, setBotStatusCache } from '@/lib/redis/bot-status-cache';

export interface BotValidationResult {
  isValid: boolean;
  status: 'active' | 'disabled' | null;
  clientId: string | null;
  error?: string;
}

/**
 * 验证 Bot 状态（带 Redis 缓存）
 * 1. 先尝试从缓存获取
 * 2. 缓存未命中则查询数据库
 * 3. 写入缓存并返回结果
 */
export async function validateBotStatus(botId: string): Promise<BotValidationResult> {
  // 1. 尝试从缓存获取
  const cached = await getBotStatusFromCache(botId);
  if (cached) {
    return {
      isValid: cached.status === 'active',
      status: cached.status,
      clientId: cached.clientId,
    };
  }

  // 2. 缓存未命中，查询数据库
  try {
    const bot = await db
      .select({ status: chat_bots.status, clientId: chat_bots.client_id })
      .from(chat_bots)
      .where(eq(chat_bots.id, botId))
      .limit(1);

    if (bot.length === 0) {
      return {
        isValid: false,
        status: null,
        clientId: null,
        error: 'BOT_NOT_FOUND',
      };
    }

    const { status, clientId } = bot[0];

    // 3. 写入缓存
    await setBotStatusCache(botId, status, clientId);

    return {
      isValid: status === 'active',
      status,
      clientId,
    };
  } catch (error) {
    console.error('Bot status validation error:', error);
    return {
      isValid: false,
      status: null,
      clientId: null,
      error: 'VALIDATION_ERROR',
    };
  }
}
