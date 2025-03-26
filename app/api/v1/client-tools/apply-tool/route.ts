import { NextResponse } from 'next/server';
import { extractApiKey, handleError } from '@/lib/utils';
import { applyClientTools } from '@/lib/actions/tools-quire/apply-client-tools';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// 请求体验证
const applyToolsSchema = z.object({
  toolIds: z.array(z.string().min(1)).min(1, '至少需要选择一个工具'),
});

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
