'use server';

import { db } from '../db';
import { ai_models, AiModel } from '../db/schema/schema';
import { eq, asc } from 'drizzle-orm';

/**
 * 获取所有可用的 AI 模型列表
 * @param category 可选的分类过滤，如 'chat' 或 'general'
 * @returns 按 sort_order 排序的 AI 模型列表
 */
export async function getAvailableModels(category?: string): Promise<AiModel[]> {
  const query = db
    .select()
    .from(ai_models)
    .where(eq(ai_models.is_active, true))
    .orderBy(asc(ai_models.sort_order));

  const models = await query;

  // 如果指定了分类，进行客户端过滤
  if (category) {
    return models.filter(model => model.categories && model.categories.includes(category));
  }

  return models;
}

/**
 * 根据 model_id 获取单个模型
 * @param modelId 模型 ID，如 'anthropic/claude-haiku-4-5'
 * @returns AI 模型或 null
 */
export async function getModelById(modelId: string): Promise<AiModel | null> {
  const result = await db.select().from(ai_models).where(eq(ai_models.model_id, modelId)).limit(1);

  return result[0] || null;
}

/**
 * 获取按 provider 分组的模型列表
 * @returns 按 provider 分组的模型对象
 */
export async function getModelsByProvider(): Promise<Record<string, AiModel[]>> {
  const models = await getAvailableModels();

  return models.reduce(
    (acc, model) => {
      const provider = model.provider;
      if (!acc[provider]) {
        acc[provider] = [];
      }
      acc[provider].push(model);
      return acc;
    },
    {} as Record<string, AiModel[]>
  );
}
