'use client';

import { createClient } from '@/lib/utils/supabase/client';
import { useAuthStore } from '@/lib/auth/auth-store';
import { useEffect } from 'react';
import { User } from '@supabase/supabase-js';

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  const { setUser } = useAuthStore();

  // 仅处理初始状态和监听变化
  useEffect(() => {
    // 设置初始状态
    setUser(initialUser);

    // 监听认证事件
    const supabase = createClient();
    const { data } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => data.subscription.unsubscribe();
  }, [initialUser, setUser]);

  return <>{children}</>;
}
