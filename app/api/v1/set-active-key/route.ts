import { NextResponse } from 'next/server';
import { z } from 'zod';
import { setActiveToken } from '@/lib/actions';
import { handleError } from '@/lib/utils';

const setActiveKeySchema = z.object({
  clientId: z.string().min(1, '客户端ID是必需的'),
  tokenId: z.string().min(1, '令牌ID是必需的'),
  userId: z.string().min(1, '用户ID是必需的'),
});

/**
 * @swagger
 * /api/v1/set-active-key:
 *   post:
 *     summary: 设置活跃API密钥
 *     description: 为指定客户端设置当前活跃的API密钥
 *     tags:
 *       - 客户端
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientId
 *               - tokenId
 *               - userId
 *             properties:
 *               clientId:
 *                 type: string
 *                 description: 客户端ID
 *               tokenId:
 *                 type: string
 *                 description: 要设置为活跃的令牌ID
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *           example:
 *             clientId: "client_123"
 *             tokenId: "token_456"
 *             userId: "user_789"
 *     responses:
 *       200:
 *         description: 活跃密钥设置成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSuccess:
 *                   type: boolean
 *                   description: 操作是否成功
 *                   example: true
 *                 message:
 *                   type: string
 *                   description: 成功消息
 *                   example: "成功设置活动令牌"
 *       400:
 *         description: 请求参数错误
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
 *                 details:
 *                   type: object
 *                 code:
 *                   type: string
 *       404:
 *         description: 找不到指定的客户端或令牌
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
 *                 details:
 *                   type: object
 *                 code:
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
 *                 details:
 *                   type: object
 *                 code:
 *                   type: string
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, tokenId, userId } = setActiveKeySchema.parse(body);

    await setActiveToken(clientId, tokenId, userId);

    return NextResponse.json({ isSuccess: true, message: '成功设置活动令牌' }, { status: 200 });
  } catch (error) {
    const { message, code, details } = handleError(error);
    const status =
      code === 'UNEXPECTED_ERROR' || code === 'UNKNOWN_ERROR'
        ? 500
        : code === 'VALIDATION_ERROR'
          ? 400
          : 400;
    return NextResponse.json({ isSuccess: false, error: message, details, code }, { status });
  }
}
