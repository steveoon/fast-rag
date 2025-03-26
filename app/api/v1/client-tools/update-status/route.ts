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
