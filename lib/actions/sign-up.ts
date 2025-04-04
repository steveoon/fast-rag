'use server';

import { encodedRedirect } from '@/lib/utils';
import { createClient } from '@/lib/utils/supabase/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslation } from '@/lib/utils';

// 可能需要在项目中其他地方使用的返回类型
export type SignUpResult = { error: string } | void;

export const signUpAction = async (formData: FormData): Promise<void> => {
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get('origin');
  const locale = (await headers()).get('Accept-Language')?.split(',')[0].split('-')[0] || 'en';

  if (!email || !password) {
    encodedRedirect(
      'error',
      '/sign-up',
      getTranslation(locale, 'Auth.SignUpPage.emailAndPasswordRequired')
    );
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + ' ' + error.message);
    encodedRedirect('error', '/sign-up', error.message);
    return;
  }

  // 检查邮箱是否已注册
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    encodedRedirect(
      'error',
      '/sign-up',
      getTranslation(locale, 'Auth.SignUpPage.emailAlreadyRegistered')
    );
    return;
  }

  encodedRedirect('success', '/sign-up', getTranslation(locale, 'Auth.SignUpPage.signUpSuccess'));
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect('error', '/sign-in', error.message);
  }

  return redirect('/platform');
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get('email')?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get('origin');
  const callbackUrl = formData.get('callbackUrl')?.toString();
  const locale = (await headers()).get('Accept-Language')?.split(',')[0].split('-')[0] || 'en';

  if (!email) {
    return encodedRedirect(
      'error',
      '/forgot-password',
      getTranslation(locale, 'Auth.ForgotPasswordPage.emailRequired')
    );
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/platform/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      'error',
      '/forgot-password',
      getTranslation(locale, 'Auth.ForgotPasswordPage.couldNotResetPassword')
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    'success',
    '/forgot-password',
    getTranslation(locale, 'Auth.ForgotPasswordPage.forgotPasswordSuccess')
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();
  const locale = (await headers()).get('Accept-Language')?.split(',')[0].split('-')[0] || 'en';
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      'error',
      '/platform/reset-password',
      getTranslation(locale, 'Auth.ForgotPasswordPage.passwordRequired')
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      'error',
      '/platform/reset-password',
      getTranslation(locale, 'Auth.ForgotPasswordPage.passwordMismatch')
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      'error',
      '/platform/reset-password',
      getTranslation(locale, 'Auth.ForgotPasswordPage.passwordUpdateFailed')
    );
  }

  encodedRedirect(
    'success',
    '/platform/reset-password',
    getTranslation(locale, 'Auth.ForgotPasswordPage.passwordUpdated')
  );
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect('/sign-in');
};
