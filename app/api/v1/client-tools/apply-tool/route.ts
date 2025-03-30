import { NextResponse } from 'next/server';
import { extractApiKey, handleError } from '@/lib/utils';
import { applyClientTools } from '@/lib/actions/tools-quire/apply-client-tools';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// 请求体验证
const applyToolsSchema = z.object({
  toolIds: z.array(z.string().min(1)).min(1, '至少需要选择一个工具'),
});

/**
 * @swagger
 * /api/v1/client-tools/apply-tool:
 *   post:
 *     summary: 为客户端应用工具
 *     description: 为客户端应用指定的工具列表，使其可用
 *     tags:
 *       - 工具
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toolIds
 *             properties:
 *               toolIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 要应用的工具ID列表
 *                 minItems: 1
 *           example:
 *             toolIds: ["knowledgeBase", "webSearch", "weather"]
 *     responses:
 *       201:
 *         description: 工具应用成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: 是否成功
 *                 appliedTools:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         description: 客户端工具关联ID
 *                       tool_id:
 *                         type: string
 *                         description: 工具ID
 *                       applied_at:
 *                         type: string
 *                         format: date-time
 *                         description: 应用时间
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
    const apiKey = extractApiKey(request);
    const body = await request.json();

    // 验证请求体
    const { toolIds } = applyToolsSchema.parse(body);

    // 应用工具
    const result = await applyClientTools(apiKey, toolIds);

    return NextResponse.json(result, { status: 201 });
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
