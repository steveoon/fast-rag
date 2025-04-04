'use server';

import { db } from '@/lib/db';
import { sql, eq } from 'drizzle-orm';
import { documents, document_versions } from '@/lib/db/schema/schema';
import { validateClient } from '@/lib/utils';
import { FileUploadRes, CustomError } from '@/types';

async function getNextVersion(documentId: string): Promise<number> {
  const result = (await db
    .select({ maxVersion: sql`MAX(version)` })
    .from(document_versions)
    .where(eq(document_versions.document_id, documentId))) as {
    maxVersion: number;
  }[];

  return (result[0].maxVersion || 0) + 1;
}

export async function addVersion(args: {
  file: FileUploadRes;
  apiKey: string;
  documentId: string;
}) {
  const { file, apiKey, documentId } = args;
  const client = await validateClient(apiKey);
  if (!client) {
    throw new CustomError('客户端验证失败', 'CLIENT_VALIDATION_FAILED');
  }

  const version = await getNextVersion(documentId);

  const insertVersionData = {
    document_id: documentId,
    storage_url: file.uploadURL,
    version,
    name: file.name,
  };

  const insertVersion = db.insert(document_versions).values(insertVersionData);
  const updateDocument = db
    .update(documents)
    .set({ storage_url: file.uploadURL })
    .where(eq(documents.id, documentId));

  try {
    await Promise.all([insertVersion, updateDocument]);
  } catch (error) {
    console.error('Error adding version:', error);
    throw new CustomError('新增版本失败', 'ADD_VERSION_FAILED');
  }
}
