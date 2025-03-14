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
      parameters: z.object({
        query: z.string().describe('用户的问题或查询内容'),
      }),
      execute: async ({ query }) => {
        console.log('查询知识库:', query);
        const queryRes = await queryEmbeddings({
          question: query,
          clientId: config.clientId,
          docs: config.docs,
          docVersions: config.docVersions,
          similarityThreshold: config.similarityThreshold,
        });
        return queryRes;
      },
    });
  },
};

export default knowledgeBaseTool;
