import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAccessToken } from '@/lib/actions';
import { handleError } from '@/lib/utils';

const createApiKeySchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  tokenDescription: z.string().optional(),
});

/**
 * @swagger
 * /api/v1/new-key:
 *   post:
 *     summary: 创建新API密钥
 *     description: 为指定客户端创建一个新的API密钥
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
 *               - userId
 *             properties:
 *               clientId:
 *                 type: string
 *                 description: 客户端ID
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *               tokenDescription:
 *                 type: string
 *                 description: 密钥描述（可选）
 *           example:
 *             clientId: "client_123"
 *             userId: "user_123"
 *             tokenDescription: "测试环境使用"
 *     responses:
 *       201:
 *         description: API密钥创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   type: string
 *                   description: 新生成的API密钥
 *                 tokenId:
 *                   type: string
 *                   description: 密钥ID
 *                 clientId:
 *                   type: string
 *                   description: 客户端ID
 *       400:
 *         description: 请求参数错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: 找不到指定的客户端
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
    const body = await request.json();
    const { clientId, tokenDescription, userId } = createApiKeySchema.parse(body);

    const result = await createAccessToken(clientId, userId, tokenDescription);

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
