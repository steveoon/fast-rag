import { NextResponse } from 'next/server';
import { updateClientToolStatus } from '@/lib/actions/tools-quire/apply-client-tools';
import { handleError, extractApiKey } from '@/lib/utils';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// 请求体验证
const updateToolStatusSchema = z.object({
  id: z.string().uuid(),
  is_enabled: z.boolean(),
});

/**
 * @swagger
 * /api/v1/client-tools/update-status:
 *   patch:
 *     summary: 更新客户端工具状态
 *     description: 启用或禁用客户端的特定工具
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
 *               - id
 *               - is_enabled
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *                 description: 客户端工具关联ID
 *               is_enabled:
 *                 type: boolean
 *                 description: 是否启用工具
 *           example:
 *             id: "123e4567-e89b-12d3-a456-426614174000"
 *             is_enabled: true
 *     responses:
 *       200:
 *         description: 工具状态更新成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                   description: 客户端工具关联ID
 *                 is_enabled:
 *                   type: boolean
 *                   description: 更新后的状态
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *                   description: 更新时间
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
 *         description: 找不到指定的工具
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
export async function PATCH(request: Request) {
  try {
    const apiKey = extractApiKey(request);

    // 解析请求体
    const body = await request.json();
    const { id, is_enabled } = updateToolStatusSchema.parse(body);

    // 调用更新函数
    const result = await updateClientToolStatus(apiKey, id, is_enabled);

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
