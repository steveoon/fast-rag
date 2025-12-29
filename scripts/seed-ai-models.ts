import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/lib/env.mjs';

// 预定义的 AI 模型列表
const AI_MODELS: {
  model_id: string;
  display_name: string;
  provider: string;
  description: string;
  categories: string[];
  sort_order: number;
}[] = [
  // Anthropic models
  {
    model_id: 'anthropic/claude-haiku-4-5',
    display_name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    description: '快速、经济实惠的 Claude 模型，适合日常任务（默认）',
    categories: ['chat', 'general'],
    sort_order: 1,
  },
  {
    model_id: 'anthropic/claude-3-7-sonnet-20250219',
    display_name: 'Claude 3.7 Sonnet',
    provider: 'anthropic',
    description: '平衡性能和成本的 Claude 模型',
    categories: ['chat', 'general'],
    sort_order: 2,
  },
  {
    model_id: 'anthropic/claude-sonnet-4-20250514',
    display_name: 'Claude Sonnet 4',
    provider: 'anthropic',
    description: 'Claude 4 系列中的 Sonnet 模型',
    categories: ['chat', 'general'],
    sort_order: 3,
  },
  {
    model_id: 'anthropic/claude-sonnet-4-5-20250929',
    display_name: 'Claude Sonnet 4.5 (最新)',
    provider: 'anthropic',
    description: '最新的 Claude Sonnet 模型，性能优秀',
    categories: ['chat', 'general'],
    sort_order: 4,
  },

  // OpenAI models
  {
    model_id: 'openai/gpt-4o',
    display_name: 'GPT-4o',
    provider: 'openai',
    description: 'OpenAI 多模态模型，支持图像和文本',
    categories: ['chat', 'general'],
    sort_order: 10,
  },
  {
    model_id: 'openai/gpt-5-mini',
    display_name: 'GPT-5 Mini',
    provider: 'openai',
    description: 'GPT-5 系列的轻量版本',
    categories: ['chat', 'general'],
    sort_order: 11,
  },
  {
    model_id: 'openai/gpt-5-chat-latest',
    display_name: 'GPT-5 Chat (最新)',
    provider: 'openai',
    description: '最新的 GPT-5 Chat 模型',
    categories: ['chat', 'general'],
    sort_order: 12,
  },
  {
    model_id: 'openai/gpt-5.1',
    display_name: 'GPT-5.1',
    provider: 'openai',
    description: 'GPT-5.1 模型',
    categories: ['chat', 'general'],
    sort_order: 13,
  },

  // Google models
  {
    model_id: 'google/gemini-2.5-flash-preview-04-17',
    display_name: 'Gemini 2.5 Flash Preview',
    provider: 'google',
    description: 'Google Gemini 2.5 Flash 预览版',
    categories: ['chat', 'general'],
    sort_order: 20,
  },
  {
    model_id: 'google/gemini-2.5-pro-preview-05-06',
    display_name: 'Gemini 2.5 Pro Preview',
    provider: 'google',
    description: 'Google Gemini 2.5 Pro 预览版',
    categories: ['chat', 'general'],
    sort_order: 21,
  },
  {
    model_id: 'google/gemini-3-pro-preview',
    display_name: 'Gemini 3 Pro Preview',
    provider: 'google',
    description: 'Google Gemini 3 Pro 预览版',
    categories: ['chat', 'general'],
    sort_order: 22,
  },

  // Qwen models
  {
    model_id: 'qwen/qwen-plus-latest',
    display_name: 'Qwen Plus Latest',
    provider: 'qwen',
    description: '通义千问 Plus 最新版',
    categories: ['chat', 'general'],
    sort_order: 30,
  },
  {
    model_id: 'qwen/qwen-max-latest',
    display_name: 'Qwen Max Latest',
    provider: 'qwen',
    description: '通义千问 Max 最新版，性能最强',
    categories: ['chat', 'general'],
    sort_order: 31,
  },

  // OpenRouter models
  {
    model_id: 'openrouter/qwen/qwen3-235b-a22b',
    display_name: 'Qwen3 235B (OpenRouter)',
    provider: 'openrouter',
    description: '通过 OpenRouter 访问的 Qwen3 235B 模型',
    categories: ['chat', 'general'],
    sort_order: 40,
  },
  {
    model_id: 'openrouter/qwen/qwen-max',
    display_name: 'Qwen Max (OpenRouter)',
    provider: 'openrouter',
    description: '通过 OpenRouter 访问的 Qwen Max 模型',
    categories: ['chat', 'general'],
    sort_order: 41,
  },
  {
    model_id: 'openrouter/moonshotai/kimi-k2-0905',
    display_name: 'Kimi K2 0905 (OpenRouter)',
    provider: 'openrouter',
    description: '通过 OpenRouter 访问的 Kimi K2 模型',
    categories: ['chat', 'general'],
    sort_order: 42,
  },
  {
    model_id: 'openrouter/anthropic/claude-3.7-sonnet',
    display_name: 'Claude 3.7 Sonnet (OpenRouter)',
    provider: 'openrouter',
    description: '通过 OpenRouter 访问的 Claude 3.7 Sonnet',
    categories: ['chat', 'general'],
    sort_order: 43,
  },
  {
    model_id: 'openrouter/anthropic/claude-sonnet-4',
    display_name: 'Claude Sonnet 4 (OpenRouter)',
    provider: 'openrouter',
    description: '通过 OpenRouter 访问的 Claude Sonnet 4',
    categories: ['chat', 'general'],
    sort_order: 44,
  },
  {
    model_id: 'openrouter/openai/gpt-4.1',
    display_name: 'GPT-4.1 (OpenRouter)',
    provider: 'openrouter',
    description: '通过 OpenRouter 访问的 GPT-4.1',
    categories: ['chat', 'general'],
    sort_order: 45,
  },
  {
    model_id: 'openrouter/openai/gpt-4o',
    display_name: 'GPT-4o (OpenRouter)',
    provider: 'openrouter',
    description: '通过 OpenRouter 访问的 GPT-4o',
    categories: ['chat', 'general'],
    sort_order: 46,
  },

  // OhMyGPT models
  {
    model_id: 'ohmygpt/gemini-2.5-flash-preview-05-20',
    display_name: 'Gemini 2.5 Flash (OhMyGPT)',
    provider: 'ohmygpt',
    description: '通过 OhMyGPT 访问的 Gemini 2.5 Flash',
    categories: ['chat', 'general'],
    sort_order: 50,
  },
  {
    model_id: 'ohmygpt/gemini-2.5-pro-preview-06-05',
    display_name: 'Gemini 2.5 Pro (OhMyGPT)',
    provider: 'ohmygpt',
    description: '通过 OhMyGPT 访问的 Gemini 2.5 Pro',
    categories: ['chat', 'general'],
    sort_order: 51,
  },

  // MoonshotAI models
  {
    model_id: 'moonshotai/kimi-k2-0905-preview',
    display_name: 'Kimi K2 0905 Preview',
    provider: 'moonshotai',
    description: 'MoonshotAI Kimi K2 预览版',
    categories: ['chat', 'general'],
    sort_order: 60,
  },
  {
    model_id: 'moonshotai/kimi-k2-thinking-turbo',
    display_name: 'Kimi K2 Thinking Turbo',
    provider: 'moonshotai',
    description: 'MoonshotAI Kimi K2 思维增强版',
    categories: ['chat', 'general'],
    sort_order: 61,
  },

  // DeepSeek models
  {
    model_id: 'deepseek/deepseek-chat',
    display_name: 'DeepSeek Chat',
    provider: 'deepseek',
    description: 'DeepSeek Chat 模型',
    categories: ['chat', 'general'],
    sort_order: 70,
  },
];

const seedAiModels = async () => {
  if (!env.DATABASE_URL) {
    throw new Error('数据库URL未配置');
  }

  // 创建连接
  const client = postgres(env.DATABASE_URL);
  const db = drizzle(client, { schema });

  try {
    console.log('🚀 开始插入 AI 模型数据...');

    for (const model of AI_MODELS) {
      const existing = await db
        .select()
        .from(schema.ai_models)
        .where(eq(schema.ai_models.model_id, model.model_id))
        .limit(1);

      if (existing.length > 0) {
        // 更新现有记录
        await db
          .update(schema.ai_models)
          .set({
            display_name: model.display_name,
            provider: model.provider,
            description: model.description,
            categories: model.categories,
            sort_order: model.sort_order,
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .where(eq(schema.ai_models.model_id, model.model_id));
        console.log(`  ✓ 更新模型: ${model.display_name}`);
      } else {
        // 插入新记录
        await db.insert(schema.ai_models).values({
          model_id: model.model_id,
          display_name: model.display_name,
          provider: model.provider,
          description: model.description,
          categories: model.categories,
          sort_order: model.sort_order,
          is_active: true,
        });
        console.log(`  + 新增模型: ${model.display_name}`);
      }
    }

    console.log(`\n🎉 成功处理 ${AI_MODELS.length} 个 AI 模型!`);
  } finally {
    await client.end();
  }
};

// 运行种子脚本
seedAiModels()
  .then(() => {
    console.log('✅ AI 模型种子数据插入完成!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ 插入过程出错:', error);
    process.exit(1);
  });
