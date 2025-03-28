import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAccessToken } from '@/lib/actions';
import { handleError } from '@/lib/utils';

const createApiKeySchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  tokenDescription: z.string().optional(),
});

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
