import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/utils/supabase/middleware';
import { logger } from '@/lib/utils/logger';
import { extractApiKey } from '@/lib/utils/extract-api-key';
import { validateRedisAPIKey } from '@/lib/api-key/validate-redis-key';
import { CustomError } from '@/types';

const allowedOrigins = [
  'https://www.chatinspire.app',
  'https://chatinspire.app',
  'https://chat-inspire-next-git-test-test-chat-page-siwencorp.vercel.app',
  'http://localhost:3000',
];

const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers':
    'Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
};

function addCorsHeaders(response: NextResponse, origin: string) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  if (allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin') ?? '';

  request.headers.set('x-pathname', pathname);

  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return addCorsHeaders(new NextResponse(null, { status: 200 }), origin);
  }

  if (pathname.startsWith('/api/v1/')) {
    try {
      const apiKey = extractApiKey(request);
      logger.info(`API Key: ${apiKey.substring(0, 10)}...`);
      await validateRedisAPIKey(apiKey);
    } catch (error) {
      if (error instanceof CustomError) {
        return addCorsHeaders(NextResponse.json({ error: error.message }, { status: 401 }), origin);
      }
      return addCorsHeaders(
        NextResponse.json({ error: '无效的 API 密钥' }, { status: 401 }),
        origin
      );
    }
  }

  const response = await updateSession(request);
  return addCorsHeaders(response, origin);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
