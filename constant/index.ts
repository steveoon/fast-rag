export const SERVER_SECRET_KEY = process.env.SERVER_SECRET_KEY;
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_PUBLIC_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 支持的语言
export const SUPPORTED_LOCALES = ['en', 'ja', 'zh'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// 通义万象文生图API URL
export const BAILIAN_API_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';
export const CREATE_TASK_URL = `${BAILIAN_API_BASE_URL}/services/aigc/text2image/image-synthesis`;
export const GET_TASK_URL = `${BAILIAN_API_BASE_URL}/tasks`;

// 请求间隔时间（毫秒）
export const POLLING_INTERVAL = 2000;
// 最大轮询次数（避免无限等待）
export const MAX_POLLING_ATTEMPTS = 30;
