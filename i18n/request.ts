import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { SUPPORTED_LOCALES, SupportedLocale } from '../constant';

function getLocaleFromAcceptLanguage(acceptLanguage: string): SupportedLocale {
  const languages = acceptLanguage.split(',').map(lang => lang.split(';')[0]);

  for (const lang of languages) {
    if (lang.startsWith('en')) return 'en';
    if (lang.startsWith('ja')) return 'ja';
    if (lang.startsWith('zh')) return 'zh';
  }

  return 'en'; // 默认英语
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const headersList = await headers();

  // 尝试从 cookie 中获取语言设置
  let locale = cookieStore.get('NEXT_LOCALE')?.value as SupportedLocale | undefined;

  // 如果 cookie 中没有语言设置，则从 Accept-Language 头部获取
  if (!locale) {
    const acceptLanguage = headersList.get('Accept-Language') || '';
    locale = getLocaleFromAcceptLanguage(acceptLanguage);
  }

  // 确保 locale 是支持的语言之一
  if (!SUPPORTED_LOCALES.includes(locale)) {
    locale = 'en';
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
