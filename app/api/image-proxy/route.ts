import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return new Response('缺少URL参数', { status: 400 });
  }

  try {
    // 增加超时设置
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    clearTimeout(timeoutId);

    // 返回图片数据
    const buffer = await response.arrayBuffer();
    return new Response(buffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400', // 缓存24小时
      },
    });
  } catch (error) {
    console.error('代理图片失败:', error);
    return new Response('获取图片失败', { status: 500 });
  }
}
