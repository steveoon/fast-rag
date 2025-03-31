import { db } from '@/lib/db';
import { chat_bots } from '@/lib/db/schema/schema';
import { eq } from 'drizzle-orm';
import { getClientApiKey } from '../redis/api-key-cache';

async function getClientIdFromBotId(botId: string) {
  const bot = await db.query.chat_bots.findFirst({
    where: eq(chat_bots.id, botId),
    columns: {
      client_id: true,
    },
  });

  if (!bot) {
    throw new Error('Bot not found');
  }

  return bot.client_id;
}

export async function getActiveKeyFromBotId(botId: string) {
  const clientId = await getClientIdFromBotId(botId);
  const apiKey = await getClientApiKey(clientId);
  return apiKey;
}
