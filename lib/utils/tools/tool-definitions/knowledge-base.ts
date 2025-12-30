import { tool } from 'ai';
import { z } from 'zod';
import { queryEmbeddings } from '@/lib/actions';
import { ToolDefinition, ToolConfig } from '../types';
import { mapToolNameToEnabledTool } from '../tool-mapping';

const knowledgeBaseTool: ToolDefinition = {
  toolName: 'queryKnowledgeBase',

  isEnabled: enabledTools => {
    return enabledTools.includes(mapToolNameToEnabledTool('queryKnowledgeBase'));
  },

  createTool: (config: ToolConfig) => {
    return tool({
      description: `从知识库中检索与用户问题相关的信息。当用户询问特定领域知识或需要参考内部文档时使用。`,
      inputSchema: z.object({
        query: z.string().describe('用户的问题或查询内容'),
        similarityThreshold: z
          .number()
          .min(0)
          .max(1)
          .describe(
            '相似度阈值(0-1)，只返回相似度高于此值的结果。短查询或模糊问题建议使用较低值(0.2-0.35)，精确专业术语查询可使用较高值(0.4-0.6)。'
          ),
      }),
      execute: async ({ query, similarityThreshold }) => {
        const threshold = similarityThreshold;

        console.log('查询知识库:', query);
        console.log('知识库配置:', {
          clientId: config.clientId,
          docs: config.docs,
          docVersions: config.docVersions,
          similarityThreshold: threshold,
        });

        try {
          const queryRes = await queryEmbeddings({
            question: query,
            clientId: config.clientId,
            docs: config.docs,
            docVersions: config.docVersions,
            similarityThreshold: threshold,
          });

          console.log(`知识库查询返回 ${queryRes.length} 条结果`);

          // 如果没有结果，返回详细信息供 LLM 分析
          if (queryRes.length === 0) {
            return {
              results: [],
              query,
              similarityThreshold: threshold,
              message: `未找到相似度高于 ${threshold} 的结果。可能原因：1) 查询"${query}"与知识库内容语义差异较大；2) 相似度阈值设置过高。建议：尝试降低阈值或改写查询。`,
            };
          }

          return {
            results: queryRes,
            count: queryRes.length,
          };
        } catch (error) {
          console.error('知识库查询错误:', error);
          if (error instanceof Error) {
            console.error('错误详情:', {
              name: error.name,
              message: error.message,
              stack: error.stack,
            });
          }

          // 返回错误信息而不是抛出异常
          return {
            error: true,
            message: error instanceof Error ? error.message : '知识库查询失败',
            details: error,
          };
        }
      },
    });
  },
};

export default knowledgeBaseTool;
