import { tool } from 'ai';
import { z } from 'zod';
import { generateObject } from 'ai';
import { registry } from '@/lib/utils/models-registry';
import { wikidataClient, exaClient } from '@/lib/clients';
import { retryRateLimited } from '@/lib/utils/retry';
import { ToolDefinition, ToolConfig } from '../types';
import { mapToolNameToEnabledTool } from '../tool-mapping';
import { formatWikidataProperties, extractEntityId } from '../wikidata';

// 创建 Wikidata 实体获取工具
export const wikidataEntityTool: ToolDefinition = {
  toolName: 'wikidataGetEntity',

  isEnabled: enabledTools => {
    return enabledTools.includes(mapToolNameToEnabledTool('wikidataGetEntity'));
  },

  createTool: (config: ToolConfig) => {
    return tool({
      description: '从Wikidata获取结构化的实体数据，包含属性、关系等信息',
      parameters: z.object({
        id: z.string().describe('Wikidata实体ID，通常以Q开头，如Q42表示道格拉斯·亚当斯'),
        languages: z
          .array(z.string())
          .optional()
          .default(['en', 'zh'])
          .describe('返回数据的语言代码'),
      }),
      execute: async ({ id, languages }) => {
        try {
          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'wikidataGetEntity',
              status: 'retrieving',
              message: `正在获取Wikidata实体(${id})...`,
            });
          }

          // 获取Wikidata实体
          const entity = await retryRateLimited(() =>
            wikidataClient.getEntityById({ id, languages })
          );

          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'wikidataGetEntity',
              status: 'complete',
              message: `已获取Wikidata实体: ${entity.labels?.zh || entity.labels?.en || id}`,
            });
          }

          // 格式化Wikidata实体属性为易读格式
          const formattedProps = formatWikidataProperties(entity);

          return {
            entity,
            formattedProperties: formattedProps,
          };
        } catch (error) {
          console.error('Wikidata实体获取错误:', error);
          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'wikidataGetEntity',
              status: 'error',
              message: `获取实体失败: ${(error as Error).message}`,
            });
          }
          return {
            error: '获取实体失败',
            message: (error as Error).message,
          };
        }
      },
    });
  },
};

// 创建智能 Wikidata 查询工具
export const smartWikidataQueryTool: ToolDefinition = {
  toolName: 'smartWikidataQuery',

  isEnabled: enabledTools => {
    return enabledTools.includes(mapToolNameToEnabledTool('smartWikidataQuery'));
  },

  createTool: (config: ToolConfig) => {
    return tool({
      description: '智能查询Wikidata实体，可以通过名称或描述查找并获取实体数据，无需事先知道实体ID',
      parameters: z.object({
        query: z.string().describe('要查询的实体名称或描述，如"苏东坡"、"阿尔伯特·爱因斯坦"等'),
        languages: z
          .array(z.string())
          .optional()
          .default(['zh', 'en'])
          .describe('返回数据的语言代码'),
      }),
      execute: async ({ query, languages }) => {
        try {
          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'smartWikidataQuery',
              status: 'searching',
              message: `正在查找"${query}"的Wikidata ID...`,
            });
          }

          // 检测是否包含中文字符
          const hasChinese = /[\u4e00-\u9fa5]/.test(query);

          // 基础搜索查询
          let searchQueries = [
            `${query} Wikidata ID`,
            `Wikidata ${query}`,
            `${query} site:wikidata.org`,
          ];

          // 如果是中文查询，使用大模型生成英文翻译
          let englishQuery = query;

          if (hasChinese) {
            try {
              // 使用generateObject获取英文翻译
              const { object: translation } = await generateObject({
                model: registry.languageModel('google:gemini-2.0-flash-exp'), // 使用较小模型节省tokens
                schema: z.object({
                  englishName: z.string().describe('实体的英文名称或翻译'),
                  confidence: z.number().min(0).max(10).describe('翻译准确度的信心值(0-10)'),
                }),
                prompt: `请将以下中文实体名称翻译成英文，返回最准确的英文名称。
                
                "${query}"
                
                如果这是一个知名人物、地点、组织或概念，请提供其最常用的英文名称。
                例如:
                - "乔布斯" → "Steve Jobs"
                - "苏东坡" → "Su Dongpo"
                - "北京" → "Beijing"
                
                如果无法确定确切翻译，请尽可能接近。为翻译准确度提供0-10的信心值。`,
              });

              englishQuery = translation.englishName;
              console.log(
                `将"${query}"翻译为"${englishQuery}"，信心值: ${translation.confidence}/10`
              );

              // 添加英文查询
              if (translation.confidence > 5) {
                searchQueries = searchQueries.concat([
                  `${englishQuery} Wikidata ID`,
                  `Wikidata ${englishQuery}`,
                  `${englishQuery} site:wikidata.org`,
                ]);
              }
            } catch (error) {
              console.error('实体名称翻译错误:', error);
              // 翻译失败时继续使用原始查询
            }
          }

          console.log(`为"${query}"生成的搜索查询:`, searchQueries);

          // 依次尝试不同的搜索查询
          let entityId: string | null = null;
          let searchedContent = '';
          let usedQuery = '';

          for (const searchQuery of searchQueries) {
            // 如果已找到ID，则停止继续搜索
            if (entityId) break;

            console.log(`尝试搜索: "${searchQuery}"`);

            const searchResults = await exaClient.search({
              query: searchQuery,
              numResults: 3,
              type: 'keyword', // 使用关键词搜索更适合查找特定ID
              contents: {
                text: { maxCharacters: 6000 },
              },
            });

            if (searchResults.results && searchResults.results.length > 0) {
              // 获取完整内容以查找ID
              const resultIds = searchResults.results.map(result => result.id);
              const contentsResponse = await exaClient.getContents({
                ids: resultIds as [string, ...string[]],
                text: { maxCharacters: 6000 },
              });

              // 合并所有搜索结果内容
              const currentContent = contentsResponse.results
                .map(result => result.text || '')
                .join('\n');

              // 尝试从内容中提取ID
              entityId = extractEntityId(currentContent);

              if (entityId) {
                console.log(`在"${searchQuery}"查询中找到ID: ${entityId}`);
                usedQuery = searchQuery;
                break; // 找到ID后停止继续搜索
              }

              // 记录已搜索内容用于返回
              searchedContent += currentContent;
            }
          }

          if (!entityId) {
            if (config.dataStream) {
              config.dataStream.writeData({
                type: 'toolStatus',
                tool: 'smartWikidataQuery',
                status: 'error',
                message: `无法找到"${query}"的Wikidata ID`,
              });
            }
            return {
              error: '查找失败',
              message: `无法找到"${query}"的Wikidata ID`,
              searchResults: searchedContent ? { content: searchedContent } : undefined,
            };
          }

          // 获取实体数据
          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'smartWikidataQuery',
              status: 'retrieving',
              message: `找到ID(${entityId})，正在获取Wikidata实体数据...`,
            });
          }

          const entity = await retryRateLimited(() =>
            wikidataClient.getEntityById({ id: entityId as string, languages })
          );

          // 格式化数据并返回
          const formattedProps = formatWikidataProperties(entity);

          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'smartWikidataQuery',
              status: 'complete',
              message: `已获取"${query}"(${entityId})的Wikidata数据`,
            });
          }

          return {
            success: true,
            entityId,
            entity,
            formattedProperties: formattedProps,
            usedQuery,
          };
        } catch (error) {
          console.error('智能Wikidata查询错误:', error);
          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'smartWikidataQuery',
              status: 'error',
              message: `查询失败: ${(error as Error).message}`,
            });
          }
          return {
            error: '查询失败',
            message: (error as Error).message,
          };
        }
      },
    });
  },
};
