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
      }),
      execute: async ({ query }) => {
        console.log('查询知识库:', query);
        console.log('知识库配置:', {
          clientId: config.clientId,
          docs: config.docs,
          docVersions: config.docVersions,
          similarityThreshold: config.similarityThreshold,
        });

        try {
          const queryRes = await queryEmbeddings({
            question: query,
            clientId: config.clientId,
            docs: config.docs,
            docVersions: config.docVersions,
            similarityThreshold: config.similarityThreshold,
          });

          console.log(`知识库查询返回 ${queryRes.length} 条结果`);

          // 如果没有结果，返回一个提示信息
          if (queryRes.length === 0) {
            return {
              results: [],
              message: '没有找到相关的知识库内容。请确保已经上传并向量化了相关文档。',
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
