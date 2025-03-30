import { NextResponse } from 'next/server';
import { extractApiKey, handleError } from '@/lib/utils';
import { getFiles } from '@/lib/actions';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/v1/files-management/list:
 *   get:
 *     summary: 获取文档列表
 *     description: 获取当前客户端的所有文档列表
 *     tags:
 *       - 文档
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       201:
 *         description: 成功获取文档列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
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
export async function GET(request: Request) {
  try {
    const apiKey = extractApiKey(request);

    const filesList = await getFiles(apiKey);

    return NextResponse.json(filesList, { status: 201 });
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
