import { NextResponse } from 'next/server';
import { inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { embeddings } from '@/lib/db/schema/schema';
import { handleError, logger, extractApiKey, validateClient } from '@/lib/utils';
import { loadFile, readFile, embedding } from '@/lib/actions';
import { EmbedData, CustomError } from '@/types';

/**
 * @swagger
 * /api/v1/doc-process/embedding:
 *   post:
 *     summary: 生成文档向量嵌入
 *     description: 对指定文档进行向量嵌入处理，用于后续的向量检索
 *     tags:
 *       - 文档
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - fileId
 *                     - versionId
 *                   properties:
 *                     fileId:
 *                       type: string
 *                       description: 文档ID
 *                     versionId:
 *                       type: string
 *                       description: 文档版本ID
 *                 description: 要处理的文件列表
 *               force:
 *                 type: boolean
 *                 description: 是否强制重新生成向量，即使文件已经处理过
 *                 default: false
 *           example:
 *             files: [
 *               {
 *                 fileId: "doc_123",
 *                 versionId: "ver_456"
 *               }
 *             ]
 *             force: false
 *     responses:
 *       201:
 *         description: 向量嵌入处理成功
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     files:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           fileId:
 *                             type: string
 *                           versionId:
 *                             type: string
 *                     force:
 *                       type: boolean
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: string
 *                       example: '所选文件已经做过向量化处理'
 *       400:
 *         description: 请求错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: 未授权，API Key 无效
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function POST(request: Request) {
  try {
    const body: {
      files: { fileId: string; versionId: string }[];
      force?: boolean;
    } = await request.json();
    logger.info(`embedding body: ${JSON.stringify(body)}`);

    /**
     * force
     * true: 对所选文件重新生成向量
     * false: 跳过已生成过向量的文件
     */
    const { files, force } = body;
    if (!files?.length) {
      throw new CustomError('请正确选择文件上传', 'UPLOAD_FILES_ERROR');
    }

    const apiKey = extractApiKey(request);
    const client = await validateClient(apiKey);
    if (!client) {
      throw new CustomError('非法请求', 'UN_AUTH_REQUEST');
    }

    const versionIds: string[] = [];
    const allPromise = files.map(async (item: { fileId: string; versionId: string }) => {
      const { fileId, versionId } = item;
      // 下载文档  如果force不为true  则跳过已经embedding 的文件
      const file = await loadFile({ fileId, force, clientId: client.id, versionId });

      if (!file) return null;

      logger.info(`files loaded: ${file.name}`);
      // 读取文档内容并chunk
      const chunkRes = await readFile(file);

      const chunks = chunkRes.chunks.map(chunk => chunk.content);
      // 向量化
      const embed = await embedding(chunks);
      if (chunks.length !== embed.length) return [];

      versionIds.push(versionId);

      return chunks.map((chunk, index) => ({
        document_version_id: versionId,
        content: chunk,
        embedding: embed[index],
      }));
    });

    const allEmbedRes = await Promise.allSettled(allPromise);

    // 过滤成功的数据
    const embedData = allEmbedRes.reduce<EmbedData[]>((acc, result) => {
      if (result.status === 'fulfilled' && result.value) {
        return [...acc, ...result.value];
      }
      return acc;
    }, []);

    logger.info(`embedData length: ${embedData.length}`);

    if (!embedData.length) {
      return NextResponse.json({ data: '所选文件已经做过向量化处理' }, { status: 201 });
    }

    if (force) {
      // 删除向量库中的数据
      await db.delete(embeddings).where(inArray(embeddings.document_version_id, versionIds));
    }

    await db.insert(embeddings).values(embedData);
    logger.info('embedding inserted');
    return NextResponse.json(body, { status: 201 });
  } catch (error) {
    const { message, code, details } = handleError(error);
    const status =
      code === 'VALIDATION_ERROR'
        ? 400
        : code === 'UNEXPECTED_ERROR' || code === 'UNKNOWN_ERROR'
          ? 500
          : 400;
    return NextResponse.json({ error: message, details, code }, { status });
  }
}
