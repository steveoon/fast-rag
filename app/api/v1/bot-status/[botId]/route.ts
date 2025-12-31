import { NextResponse } from 'next/server';
import { validateBotStatus } from '@/lib/utils/validate-bot-status';
import { extractApiKey, validateClient, handleError } from '@/lib/utils';
import { CustomError } from '@/types';

/**
 * @swagger
 * /api/v1/bot-status/{botId}:
 *   get:
 *     summary: 检查聊天机器人状态
 *     description: 获取指定聊天机器人的启用/禁用状态
 *     tags:
 *       - 机器人状态
 *     parameters:
 *       - in: path
 *         name: botId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 聊天机器人ID
 *     responses:
 *       200:
 *         description: 成功返回机器人状态
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     botId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [active, disabled]
 *                     isActive:
 *                       type: boolean
 *       401:
 *         description: 未授权访问
 *       403:
 *         description: 无权访问此机器人
 *       404:
 *         description: 机器人不存在
 *     security:
 *       - BearerAuth: []
 */
export async function GET(request: Request, { params }: { params: Promise<{ botId: string }> }) {
  try {
    const apiKey = extractApiKey(request);
    const client = await validateClient(apiKey);
    if (!client) {
      throw new CustomError('非法请求', 'UN_AUTH_REQUEST');
    }

    const { botId } = await params;

    if (!botId) {
      throw new CustomError('缺少 botId 参数', 'MISSING_BOT_ID');
    }

    const botValidation = await validateBotStatus(botId);

    if (botValidation.error === 'BOT_NOT_FOUND') {
      return NextResponse.json(
        { error: '聊天机器人不存在', code: 'BOT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 验证 Bot 属于当前 Client
    if (botValidation.clientId !== client.id) {
      return NextResponse.json(
        { error: '无权访问此聊天机器人', code: 'UNAUTHORIZED_BOT_ACCESS' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      data: {
        botId,
        status: botValidation.status,
        isActive: botValidation.isValid,
      },
    });
  } catch (error) {
    const { message, code } = handleError(error);
    const status = code === 'UN_AUTH_REQUEST' ? 401 : 400;
    return NextResponse.json({ error: message, code }, { status });
  }
}
