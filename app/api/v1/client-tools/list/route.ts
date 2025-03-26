import { NextResponse } from 'next/server';
import { getClientToolsByClientId } from '@/lib/actions/tools-quire/get-client-tools';
import { handleError, extractApiKey } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    const result = await getClientToolsByClientId(apiKey);

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
