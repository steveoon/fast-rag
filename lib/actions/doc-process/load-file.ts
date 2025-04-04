'use server';

import { db } from '@/lib/db';
import { documents, document_versions, embeddings } from '@/lib/db/schema/schema';
import { eq, and } from 'drizzle-orm';
import { CustomError } from 'types';

async function fetchFileContent(url: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 直接将响应读取为 ArrayBuffer
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch file: ${error.message}`);
    }
    throw error;
  }
}

export async function loadFile(args: {
  fileId: string;
  force?: boolean;
  clientId: string;
  versionId: string;
}) {
  const { fileId, force, clientId, versionId } = args;

  // 根据clientId和documentId查文档
  const queryDocument = db
    .select()
    .from(documents)
    .where(and(eq(documents.id, fileId), eq(documents.client_id, clientId)));

  // 根据versionId在版本的表里查文档id
  const versionQuery = db
    .select({ document_id: document_versions.document_id })
    .from(document_versions)
    .where(eq(document_versions.id, versionId));

  const [[file], [versionResult]] = await Promise.all([queryDocument, versionQuery]);

  if (!file) {
    throw new CustomError('未查找到文件', 'FIND_FILE_ERROR');
  }

  // 用版本表里的document_id和文档id对比，如果不一致则抛出错误
  if (fileId !== versionResult?.document_id) {
    throw new CustomError('文件与版本不匹配', 'FIND_FILE_AND_VERSION_ERROR');
  }

  const embeddingData = await db
    .select({ id: embeddings.id })
    .from(embeddings)
    .where(eq(embeddings.document_version_id, versionId));

  // 已经做过向量化则跳过
  if (!force && embeddingData?.length) return null;

  if (!file || !file.storage_url) {
    throw new Error('File not found or storage URL is missing');
  }

  const content = await fetchFileContent(file.storage_url);

  return {
    ...file,
    content,
  };
}
