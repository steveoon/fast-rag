import { createServerClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_PUBLIC_ANON_KEY } from '@/constant';
import { cookies } from 'next/headers';
import { logger } from '../logger/logger';
/**
 * 创建Supabase Server 客户端
 * 用于在服务器组件中创建Supabase客户端
 * @returns
 */
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL!, SUPABASE_PUBLIC_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          logger.error(error);
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
};
