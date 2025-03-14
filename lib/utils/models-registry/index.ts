import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai';

export const registry = createProviderRegistry({
  // register provider with prefix and default setup:
  anthropic: createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),

  // register provider with prefix and custom setup:
  openai: createOpenAI({
    baseURL: 'https://api.ohmygpt.com/v1/',
    apiKey: process.env.OPENAI_API_KEY,
  }),

  google: createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
  }),
});
