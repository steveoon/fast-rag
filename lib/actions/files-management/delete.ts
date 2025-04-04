'use server';

import { db } from '@/lib/db';
import { documents, document_versions, embeddings } from '@/lib/db/schema/schema';
import { validateClient } from '@/lib/utils';
import { inArray } from 'drizzle-orm';

export async function delFiles(fileIds: string[], apiKey: string) {
  const client = await validateClient(apiKey);
  if (!client) return;
  const delVersions = await db
    .delete(document_versions)
    .where(inArray(document_versions.document_id, fileIds))
    .returning();

  await Promise.allSettled([
    db.delete(documents).where(inArray(documents.id, fileIds)),
    db.delete(embeddings).where(
      inArray(
        embeddings.document_version_id,
        delVersions.map(v => v.document_id)
      )
    ),
  ]);

  return {
    success: true,
  };
}
