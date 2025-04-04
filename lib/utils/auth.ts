'use server';

import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema/schema';
import { eq } from 'drizzle-orm';
import { CustomError } from '@/types';

export async function validateClient(apiKey: string) {
  const client = await db.select().from(clients).where(eq(clients.api_key, apiKey));
  if (!client) {
    throw new CustomError('客户端不存在', 'CLIENT_NOT_FOUND');
  }

  return client[0];
}
