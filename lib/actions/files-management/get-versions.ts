'use server';

import { db } from '@/lib/db';
import { document_versions } from '@/lib/db/schema/schema';
import { CustomError } from '@/types';
import { desc, eq } from 'drizzle-orm';
import { validateClient } from '@/lib/utils';

export async function getVersions(args: { documentId: string; apiKey: string }) {
  const { documentId, apiKey } = args;

  const client = await validateClient(apiKey);
  if (!client) {
    throw new CustomError('非法请求', 'UN_AUTH_REQUEST');
  }

  const versions = await db
    .select()
    .from(document_versions)
    .where(eq(document_versions.document_id, documentId))
    .orderBy(desc(document_versions.version));

  return versions;
}
