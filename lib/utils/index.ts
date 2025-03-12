import { customAlphabet } from 'nanoid';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { redirect } from 'next/navigation';

export * from './error';
export * from './logger';
export * from './unique-verification';
export * from './file-utils';
export * from './auth';
export * from './translations';
export * from './extract-api-key';
export * from './retry';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789');

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(type: 'error' | 'success', path: string, message: string) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}
