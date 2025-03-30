import { NextResponse } from 'next/server';
import { getClientToolsByClientId } from '@/lib/actions/tools-quire/get-client-tools';
import { handleError, extractApiKey } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/v1/client-tools/list:
 *   get:
 *     summary: 获取客户端可用工具列表
 *     description: 根据 API Key 获取该客户端可用的所有工具列表
 *     tags:
 *       - 工具
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: 成功获取工具列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     description: 客户端工具关联ID
 *                   tool_id:
 *                     type: string
 *                     description: 工具ID
 *                   name:
 *                     type: string
 *                     description: 工具名称
 *                   description:
 *                     type: string
 *                     description: 工具描述
 *                   is_enabled:
 *                     type: boolean
 *                     description: 是否启用
 *                   applied_at:
 *                     type: string
 *                     format: date-time
 *                     description: 应用时间
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
    const result = await getClientToolsByClientId(apiKey);

    return NextResponse.json(result);
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
