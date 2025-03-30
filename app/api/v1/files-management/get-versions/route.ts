import { NextResponse } from 'next/server';
import { extractApiKey, handleError } from '@/lib/utils';
import { getVersions } from '@/lib/actions';
import { CustomError } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/v1/files-management/get-versions:
 *   get:
 *     summary: 获取文档版本列表
 *     description: 获取指定文档的所有版本列表
 *     tags:
 *       - 文档
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: documentId
 *         required: true
 *         schema:
 *           type: string
 *         description: 文档ID
 *     responses:
 *       201:
 *         description: 成功获取文档版本列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DocumentVersion'
 *       400:
 *         description: 请求错误，如文档ID为空
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
 *       404:
 *         description: 找不到指定的文档
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
export async function GET(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      throw new CustomError('文档ID不能为空', 'DOCUMENT_ID_EMPTY');
    }

    const versionList = await getVersions({ apiKey, documentId });

    return NextResponse.json(versionList, { status: 201 });
  } catch (error) {
    const { message, code, details } = handleError(error);
    const status =
      code === 'UNEXPECTED_ERROR' || code === 'UNKNOWN_ERROR'
        ? 500
        : code === 'VALIDATION_ERROR'
          ? 400
          : 400;
    return NextResponse.json({ error: message, details, code }, { status });
  }
}
