import { NextResponse } from 'next/server';
import { validateAPIKey } from '@/lib/api-key';
import { handleError, extractApiKey } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/v1/validate-key:
 *   get:
 *     summary: 验证API密钥
 *     description: 验证提供的API密钥是否有效
 *     tags:
 *       - 客户端
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: API密钥验证成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSuccess:
 *                   type: boolean
 *                   description: 验证结果
 *                   example: true
 *                 message:
 *                   type: string
 *                   description: 成功消息
 *                   example: "验证成功"
 *       400:
 *         description: 验证失败，API密钥无效
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSuccess:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSuccess:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 */
export async function GET(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    await validateAPIKey(apiKey);

    return NextResponse.json({ isSuccess: true, message: '验证成功' }, { status: 200 });
  } catch (error) {
    const { message, code } = handleError(error);
    const status = code === 'UNEXPECTED_ERROR' || code === 'UNKNOWN_ERROR' ? 500 : 400;
    return NextResponse.json({ isSuccess: false, error: message }, { status });
  }
}
