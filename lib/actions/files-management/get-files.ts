'use server';

import { db } from '@/lib/db';
import { documents, document_versions } from '@/lib/db/schema/schema';
import { validateClient } from '@/lib/utils';
import { CustomError } from '@/types';
import { eq, sql, desc } from 'drizzle-orm';

export async function getFiles(apiKey: string) {
  const client = await validateClient(apiKey);
  if (!client) {
    throw new CustomError('非法请求', 'UN_AUTH_REQUEST');
  }

  // 创建一个子查询来获取每个文档的最新版本
  const latestVersions = db.$with('latest_versions').as(
    db
      .select({
        document_id: document_versions.document_id,
        version_id: document_versions.id,
        version: document_versions.version,
      })
      .from(document_versions)
      .where(
        sql`(${document_versions.document_id}, ${document_versions.created_at}) IN (
        SELECT ${document_versions.document_id}, MAX(${document_versions.created_at})
        FROM ${document_versions}
        GROUP BY ${document_versions.document_id}
      )`
      )
  );

  const fileList = await db
    .with(latestVersions)
    .select({
      id: documents.id,
      name: documents.name,
      type: documents.type,
      version_id: latestVersions.version_id,
      storage_url: documents.storage_url,
      created_at: documents.created_at,
      updated_at: documents.updated_at,
      version: latestVersions.version,
    })
    .from(documents)
    .leftJoin(latestVersions, eq(documents.id, latestVersions.document_id))
    .where(eq(documents.client_id, client.id))
    .orderBy(desc(documents.created_at));

  return fileList.map(file => {
    return file;
  });
}
