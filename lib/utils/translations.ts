import { SupportedLocale } from '@/constant';
import en from '@/messages/en.json';
import zh from '@/messages/zh.json';
import ja from '@/messages/ja.json';

const translations = { en, zh, ja };

export function getTranslation(locale: string, key: string): string {
  const keys = key.split('.');
  let result: unknown = translations[locale as keyof typeof translations];
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      return key; // 如果找不到翻译，返回原始 key
    }
  }
  return typeof result === 'string' ? result : key;
}

export function t(message: string, params?: Record<string, unknown>): string {
  const locale = document.cookie
    .split('; ')
    .find(row => row.startsWith('NEXT_LOCALE='))
    ?.split('=')[1] as SupportedLocale;

  let translatedText = getTranslation(locale, message);

  // 处理参数替换
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      translatedText = translatedText.replace(new RegExp(`{${key}}`, 'g'), String(value));
    });
  }

  return translatedText;
}
