import { NextResponse } from 'next/server';
import { extractApiKey, handleError } from '@/lib/utils';
import { delFiles } from '@/lib/actions/files-management/delete';

/**
 * @swagger
 * /api/v1/files-management/delete:
 *   post:
 *     summary: 删除文档
 *     description: 删除指定的一个或多个文档
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
 *               - fileIds
 *             properties:
 *               fileIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 要删除的文档ID列表
 *           example:
 *             fileIds: ["doc_123", "doc_456"]
 *     responses:
 *       201:
 *         description: 文档删除成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: string
 *                   description: 结果标识
 *           example:
 *             data: "deleted"
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
export async function POST(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    const body = await request.json();

    await delFiles(body.fileIds, apiKey);

    return NextResponse.json({ data: 'deleted' }, { status: 201 });
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
