import { tool } from 'ai';
import { z } from 'zod';
import { exaClient } from '@/lib/clients';
import { exa } from '@agentic/exa';
import { ToolDefinition, ToolConfig } from '../types';
import { mapToolNameToEnabledTool } from '../tool-mapping';

const webSearchTool: ToolDefinition = {
  toolName: 'webSearch',

  isEnabled: enabledTools => {
    return enabledTools.includes(mapToolNameToEnabledTool('webSearch'));
  },

  createTool: (config: ToolConfig) => {
    return tool({
      description: '在互联网上搜索相关信息，获取最新、最相关的内容',
      parameters: z.object({
        query: z.string().describe('搜索查询'),
        numResults: z.number().optional().default(5).describe('返回结果数量，建议3-7个'),
        useNeural: z
          .boolean()
          .optional()
          .default(true)
          .describe('是否使用神经搜索（更适合语义查询）'),
      }),
      execute: async ({ query, numResults, useNeural }) => {
        try {
          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'webSearch',
              status: 'searching',
              message: `正在搜索: "${query}"`,
            });
          }

          // 执行搜索
          const searchResults = await exaClient.search({
            query,
            numResults,
            type: useNeural ? 'neural' : 'keyword',
            contents: {
              text: { maxCharacters: 8000 },
              highlights: {
                query,
                numSentences: 3,
                highlightsPerUrl: 3,
              },
            },
          });

          if (!searchResults.results || searchResults.results.length === 0) {
            if (config.dataStream) {
              config.dataStream.writeData({
                type: 'toolStatus',
                tool: 'webSearch',
                status: 'noResults',
                message: '未找到相关结果',
              });
            }
            return { results: [], message: '未找到相关信息' };
          }

          const relevantResults = searchResults.results.slice(0, numResults);
          const resultIds = relevantResults.map(result => result.id);

          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'webSearch',
              status: 'retrieving',
              message: `找到 ${relevantResults.length} 个相关结果，正在获取详细内容...`,
            });
          }

          // 获取详细内容
          let contentDetails: exa.SearchResponse['results'] = [];

          if (resultIds.length > 0) {
            const contentsResponse = await exaClient.getContents({
              ids: resultIds as [string, ...string[]],
              text: { maxCharacters: 15000 },
              highlights: {
                query,
                numSentences: 5,
              },
            });
            contentDetails = contentsResponse.results;
          }

          const processedResults = contentDetails.map((result, index) => {
            // 提取主域名作为来源标识
            const domain = new URL(result.url).hostname.replace('www.', '');

            return {
              id: `[${index + 1}]`,
              title: result.title || '无标题',
              url: result.url,
              domain,
              publishedDate: result.publishedDate,
              text: result.text,
              highlights: result.highlights,
              // 添加引用标记
              citation: `[${index + 1}](${result.url})`,
            };
          });

          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'webSearch',
              status: 'complete',
              message: `已获取 ${processedResults.length} 个网页内容`,
              meta: {
                resultCount: processedResults.length,
                sources: processedResults.map(r => ({ title: r.title, url: r.url })),
              },
            });
          }

          return {
            results: processedResults,
            message: `找到 ${processedResults.length} 个相关结果`,
            searchQuery: query,
          };
        } catch (error) {
          console.error('网络搜索错误:', error);
          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'webSearch',
              status: 'error',
              message: `搜索失败: ${(error as Error).message}`,
            });
          }
          return {
            error: '搜索失败',
            message: (error as Error).message,
            results: [],
          };
        }
      },
    });
  },
};

export default webSearchTool;
