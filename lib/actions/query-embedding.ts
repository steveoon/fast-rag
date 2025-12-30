'use server';

import { db } from '@/lib/db';
import { embeddings, documents, document_versions } from '@/lib/db/schema/schema';
import { gt, sql, cosineDistance, eq, and, inArray } from 'drizzle-orm';
import { embedding } from './doc-process/embedding';

/**
 * 查询文档嵌入并返回相似内容
 *
 * 该函数根据给定的问题和客户ID，查询文档嵌入数据库，
 * 返回与问题最相似的文档内容。它使用余弦相似度来计算问题与文档嵌入之间的相似性。
 *
 * @param {Object} args - 查询参数对象
 * @param {string} args.question - 要查询的问题文本
 * @param {string} args.clientId - 客户的唯一标识符
 * @param {string[]} [args.docs] - 可选的文档ID数组，用于限制查询范围
 * @param {string[]} [args.docVersions] - 可选的文档版本ID数组，用于限制查询范围
 * @param {number} args.similarityThreshold - 相似度阈值(0-1)，只返回相似度高于此值的结果
 * @returns {Promise<string[]>} 返回一个 Promise，解析为与问题最相似的文档内容数组（最多4个）
 */
export async function queryEmbeddings(args: {
  question: string;
  clientId: string;
  docs?: string[];
  docVersions?: string[];
  similarityThreshold: number;
}) {
  const { question, clientId, docs, docVersions, similarityThreshold } = args;

  // 如果没有指定文档或文档版本，直接返回空数组
  if ((docs && docs.length === 0) || (docVersions && docVersions.length === 0)) {
    console.log('queryEmbeddings: 没有指定文档或文档版本，返回空结果');
    return [];
  }

  const questionEmbedding = await embedding([question]);
  const similarity = sql<number>`1 - (${cosineDistance(embeddings.embedding, questionEmbedding[0])})`;

  const whereConditions = [eq(documents.client_id, clientId), gt(similarity, similarityThreshold)];

  // 如果提供了文档 ID，添加到查询条件中
  if (docs?.length) {
    whereConditions.push(inArray(documents.id, docs));
  }

  // 如果提供了文档版本 ID，添加到查询条件中
  if (docVersions?.length) {
    whereConditions.push(inArray(document_versions.id, docVersions));
  }

  const queryRes = await db
    .select({
      content: embeddings.content,
    })
    .from(documents)
    .innerJoin(document_versions, eq(documents.id, document_versions.document_id))
    .innerJoin(embeddings, eq(document_versions.id, embeddings.document_version_id))
    .where(and(...whereConditions))
    .limit(4);

  return queryRes.map(item => item.content);
}
