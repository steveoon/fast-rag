import { NextResponse } from 'next/server';
import { createClientWithApiKey } from '@/lib/actions';
import { z } from 'zod';
import { handleError } from '@/lib/utils';

const createClientSchema = z.object({
  clientName: z
    .string()
    .min(1, 'Client name is required')
    .regex(/^[a-zA-Z0-9_-]+$/, '客户端名称格式无效，只能包含英文、数字、下划线和短横线'),
  userId: z.string().min(1, 'User ID is required'),
  tokenDescription: z.string().optional(),
});

/**
 * @swagger
 * /api/v1/new-client:
 *   post:
 *     summary: 创建新客户端
 *     description: 创建一个新的客户端并生成关联的API密钥
 *     tags:
 *       - 客户端
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clientName
 *               - userId
 *             properties:
 *               clientName:
 *                 type: string
 *                 description: 客户端名称，只能包含英文、数字、下划线和短横线
 *                 pattern: ^[a-zA-Z0-9_-]+$
 *               userId:
 *                 type: string
 *                 description: 用户ID
 *               tokenDescription:
 *                 type: string
 *                 description: 密钥描述（可选）
 *           example:
 *             clientName: "my-client-app"
 *             userId: "user_123"
 *             tokenDescription: "开发环境使用"
 *     responses:
 *       201:
 *         description: 客户端创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientId:
 *                   type: string
 *                   description: 新创建的客户端ID
 *                 clientName:
 *                   type: string
 *                   description: 客户端名称
 *                 apiKey:
 *                   type: string
 *                   description: 新生成的API密钥
 *                 hashedToken:
 *                   type: string
 *                   description: 密钥的哈希值
 *       400:
 *         description: 请求参数错误
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
    const { clientName, userId, tokenDescription } = createClientSchema.parse(body);

    const result = await createClientWithApiKey(clientName, userId, tokenDescription);

    return NextResponse.json(result, { status: 201 });
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
