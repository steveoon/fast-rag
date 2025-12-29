import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createProviderRegistry, LanguageModel } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

/**
 * 模型注册表 - 支持多个 AI 模型提供商
 * 使用 createProviderRegistry 统一管理所有 provider
 */
export const registry = createProviderRegistry(
  {
    // Anthropic provider (通过 OhMyGPT 代理)
    anthropic: createAnthropic({
      baseURL: 'https://apic1.ohmycdn.com/v1/',
      apiKey: process.env.OPENAI_API_KEY, // OhMyGPT 代理使用统一的 API Key
    }),

    // OpenAI provider
    openai: createOpenAI({
      baseURL: 'https://apic1.ohmycdn.com/v1/',
      apiKey: process.env.OPENAI_API_KEY,
    }),

    // Google provider
    google: createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),

    // OpenRouter provider
    // Note: @openrouter/ai-sdk-provider 尚未完全支持 AI SDK v6
    /* eslint-disable @typescript-eslint/no-explicit-any */
    openrouter: createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    }) as any,
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // OhMyGPT provider (OpenAI compatible)
    ohmygpt: createOpenAICompatible({
      name: 'ohmygpt',
      baseURL: 'https://apic1.ohmycdn.com/v1/',
      apiKey: process.env.OPENAI_API_KEY,
    }),

    // Qwen provider (通义千问)
    qwen: createOpenAICompatible({
      name: 'qwen',
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      apiKey: process.env.DASHSCOPE_API_KEY,
    }),

    // MoonshotAI provider (Kimi)
    moonshotai: createOpenAICompatible({
      name: 'moonshotai',
      baseURL: 'https://api.moonshot.cn/v1',
      apiKey: process.env.MOONSHOT_API_KEY,
    }),

    // DeepSeek provider
    deepseek: createOpenAICompatible({
      name: 'deepseek',
      baseURL: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
    }),
  },
  { separator: '/' }
);

// 导出单独的 openrouter 实例，以便需要时使用
export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

// 所有支持的 provider 前缀列表
type SupportedProvider =
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'openrouter'
  | 'ohmygpt'
  | 'qwen'
  | 'moonshotai'
  | 'deepseek';

const SUPPORTED_PROVIDERS: SupportedProvider[] = [
  'anthropic',
  'openai',
  'google',
  'openrouter',
  'ohmygpt',
  'qwen',
  'moonshotai',
  'deepseek',
];

/**
 * 根据 model_id 获取对应的语言模型
 * 所有已注册的 provider 都通过 registry 直接访问
 *
 * @param modelId 模型 ID，如 'anthropic/claude-haiku-4-5' 或 'qwen/qwen-max-latest'
 * @returns 语言模型实例
 */
export function getLanguageModel(modelId: string): LanguageModel {
  // 提取 provider 前缀
  const provider = modelId.split('/')[0] as SupportedProvider;

  // 检查是否是支持的 provider
  if (SUPPORTED_PROVIDERS.includes(provider)) {
    // 使用 registry 直接访问
    return registry.languageModel(modelId as `${SupportedProvider}/${string}`);
  }

  // 对于未知的 provider，尝试通过 OpenRouter 代理
  console.warn(`未知的 provider: ${provider}，尝试通过 OpenRouter 访问`);
  return openrouter(modelId);
}
