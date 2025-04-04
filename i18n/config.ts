import { SUPPORTED_LOCALES } from '../constant';

export const defaultLocale = 'en';
export const locales = SUPPORTED_LOCALES;

export type Locale = (typeof locales)[number];
