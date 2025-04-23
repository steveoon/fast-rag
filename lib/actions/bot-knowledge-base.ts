'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  chat_bot_knowledge_bases,
  chat_bots,
  documents,
  document_versions,
} from '@/lib/db/schema/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { getActiveClientInfo } from '@/lib/actions/get-active-client';
import { CustomError } from '@/types';

// Zod验证Schema
const UpdateBotKnowledgeBaseSchema = z.object({
  botId: z.string().uuid(),
  documentVersionIds: z.array(z.string().uuid()),
});

/**
 * 获取当前活跃客户端的所有文档及其版本
 * 用于在机器人配置页面展示可用的知识库
 */
export async function getActiveClientDocuments() {
  try {
    // 获取当前活跃客户端信息
    const clientInfo = await getActiveClientInfo();
    if (!clientInfo || !clientInfo.id) {
      throw new CustomError('未找到活跃客户端', 'NO_ACTIVE_CLIENT');
    }

    // 获取该客户端的所有文档(包含版本)
    const docsWithVersions = await db.query.documents.findMany({
      where: eq(documents.client_id, clientInfo.id),
      with: {
        document_versions: {
          orderBy: [desc(document_versions.version)],
        },
      },
      orderBy: [desc(documents.updated_at)],
    });

    // 格式化返回数据
    return docsWithVersions.map(doc => ({
      id: doc.id,
      name: doc.name,
      type: doc.type,
      versions: doc.document_versions.map(version => ({
        id: version.id,
        version: version.version,
        name: version.name,
        createdAt: version.created_at,
      })),
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    }));
  } catch (error) {
    console.error('获取活跃客户端文档失败:', error);
    throw new Error(error instanceof CustomError ? error.message : '无法获取可用的知识库文档列表');
  }
}

/**
 * 获取特定机器人已分配的知识库文档及其版本
 * @param botId 机器人ID
 */
export async function getBotAssignedKnowledgeBases(botId: string) {
  if (!botId) {
    throw new CustomError('机器人ID不能为空', 'INVALID_PARAMS');
  }

  try {
    // 验证机器人存在且属于当前活跃客户端
    const activeClient = await getActiveClientInfo();
    if (!activeClient || !activeClient.id) {
      throw new CustomError('未找到活跃客户端', 'NO_ACTIVE_CLIENT');
    }

    const bot = await db.query.chat_bots.findFirst({
      where: and(eq(chat_bots.id, botId), eq(chat_bots.client_id, activeClient.id)),
    });

    if (!bot) {
      throw new CustomError('未找到指定的机器人或无权访问', 'BOT_NOT_FOUND');
    }

    // 获取机器人关联的所有知识库文档版本
    const knowledgeBases = await db.query.chat_bot_knowledge_bases.findMany({
      where: eq(chat_bot_knowledge_bases.chat_bot_id, botId),
      with: {
        document_version: {
          with: {
            document: true,
          },
        },
      },
    });

    // 格式化返回数据
    return knowledgeBases.map(kb => ({
      id: kb.id,
      documentVersionId: kb.document_version_id,
      documentId: kb.document_version.document_id,
      documentName: kb.document_version.document.name,
      documentType: kb.document_version.document.type,
      versionNumber: kb.document_version.version,
      versionName: kb.document_version.name,
    }));
  } catch (error) {
    console.error('获取机器人知识库失败:', error);
    throw new Error(error instanceof CustomError ? error.message : '无法获取机器人关联的知识库');
  }
}

/**
 * 更新机器人关联的知识库版本
 * @param data 包含botId和documentVersionIds的对象
 */
export async function updateBotKnowledgeBases(data: z.infer<typeof UpdateBotKnowledgeBaseSchema>) {
  const validation = UpdateBotKnowledgeBaseSchema.safeParse(data);
  if (!validation.success) {
    console.error('更新机器人知识库的输入无效:', validation.error.flatten());
    throw new CustomError(
      `输入无效: ${JSON.stringify(validation.error.flatten().fieldErrors)}`,
      'INVALID_INPUT'
    );
  }

  const { botId, documentVersionIds } = validation.data;

  try {
    // 获取当前活跃客户端
    const activeClient = await getActiveClientInfo();
    if (!activeClient || !activeClient.id) {
      throw new CustomError('未找到活跃客户端', 'NO_ACTIVE_CLIENT');
    }

    // 验证机器人存在且属于当前活跃客户端
    const bot = await db.query.chat_bots.findFirst({
      where: and(eq(chat_bots.id, botId), eq(chat_bots.client_id, activeClient.id)),
    });

    if (!bot) {
      throw new CustomError('未找到指定的机器人或无权访问', 'BOT_NOT_FOUND');
    }

    // 验证所有documentVersionIds都存在并且属于当前客户端
    if (documentVersionIds.length > 0) {
      const versions = await db.query.document_versions.findMany({
        where: eq(document_versions.id, documentVersionIds[0]),
        with: {
          document: true,
        },
      });

      for (const version of versions) {
        if (version.document.client_id !== activeClient.id) {
          throw new CustomError('无权访问指定的文档版本', 'UNAUTHORIZED');
        }
      }
    }

    // 使用事务保证原子性操作
    await db.transaction(async tx => {
      // 1. 先删除所有现有关联
      await tx
        .delete(chat_bot_knowledge_bases)
        .where(eq(chat_bot_knowledge_bases.chat_bot_id, botId));

      // 2. 如果有新的关联，添加它们
      if (documentVersionIds.length > 0) {
        await tx.insert(chat_bot_knowledge_bases).values(
          documentVersionIds.map(versionId => ({
            chat_bot_id: botId,
            document_version_id: versionId,
          }))
        );
      }

      // 3. 更新Bot的updatedAt时间
      await tx
        .update(chat_bots)
        .set({ updated_at: new Date().toISOString() })
        .where(eq(chat_bots.id, botId));
    });

    // 使相关页面的缓存失效
    revalidatePath('/platform/bots-management');
    revalidatePath(`/platform/bots-management/${botId}`);

    return {
      success: true,
      message: '成功更新机器人知识库配置。',
      count: documentVersionIds.length,
    };
  } catch (error) {
    console.error(`更新机器人 ${botId} 的知识库失败:`, error);
    throw new Error(error instanceof CustomError ? error.message : '更新机器人知识库配置失败');
  }
}
