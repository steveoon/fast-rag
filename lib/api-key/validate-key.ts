'use server';

import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema/schema';
import { eq } from 'drizzle-orm';
import { SERVER_SECRET_KEY } from '@/constant';
import { CustomError } from '@/types';

export async function validateAPIKey(key: string): Promise<boolean> {
  const [prefix, secret, receivedSignature] = key.split('.');

  if (!prefix || !secret || !receivedSignature) {
    throw new CustomError('无效的 API 密钥格式', 'INVALID_API_KEY_FORMAT');
  }

  if (!SERVER_SECRET_KEY) {
    throw new CustomError('服务器密钥未定义', 'SERVER_SECRET_KEY_NOT_DEFINED');
  }

  const [client] = await db.select().from(clients).where(eq(clients.api_key, key)).limit(1);

  if (!client) {
    throw new CustomError('API 密钥不存在', 'API_KEY_NOT_FOUND');
  }

  const dataToSign = `${client.id}:${prefix}:${secret}`;
  const calculatedSignature = Buffer.from(hmac(sha256, SERVER_SECRET_KEY, dataToSign))
    .toString('base64')
    .replace(/[+/]/g, '-')
    .replace(/=/g, '')
    .slice(0, 16);

  if (calculatedSignature !== receivedSignature) {
    throw new CustomError('API 密钥验证失败', 'API_KEY_VALIDATION_FAILED');
  }

  return true;
}
