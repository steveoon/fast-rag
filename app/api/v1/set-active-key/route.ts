import { NextResponse } from 'next/server';
import { z } from 'zod';
import { setActiveToken } from '@/lib/actions';
import { handleError } from '@/lib/utils';

const setActiveKeySchema = z.object({
  clientId: z.string().min(1, '客户端ID是必需的'),
  tokenId: z.string().min(1, '令牌ID是必需的'),
  userId: z.string().min(1, '用户ID是必需的'),
});

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
