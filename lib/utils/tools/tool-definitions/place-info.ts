import { tool } from 'ai';
import { z } from 'zod';
import { generateObject } from 'ai';
import { registry } from '@/lib/utils/models-registry';
import { ToolDefinition, ToolConfig } from '../types';
import { mapToolNameToEnabledTool } from '../tool-mapping';
import { wikipediaClient } from '@/lib/clients';
import webSearchTool from './web-search';

// 地点信息Schema定义
export const PlaceInfoSchema = z.object({
  placeName: z.string().describe('地点名称'),
  introduction: z.string().describe('地点的简要介绍'),
  highlights: z.array(z.string()).describe('主要亮点或必看之处列表'),
  practicalTips: z.array(z.string()).describe('实用的旅行建议或小贴士列表'),
  transportInfo: z.string().optional().describe('交通方式建议'),
  bestTimeToVisit: z.string().optional().describe('最佳访问季节或月份建议'),
  estimatedVisitDuration: z.string().optional().describe('建议的参观或停留时长'),
  officialWebsite: z.string().url().optional().describe('官方网站链接'),
  keyLinks: z
    .array(
      z.object({
        name: z.string().describe('链接名称，例如"预订游船"'),
        url: z.string().url().describe('相关链接URL'),
      })
    )
    .optional()
    .describe('其他重要链接列表'),
  sourceAttribution: z
    .array(z.string())
    .describe('用于生成此信息的主要数据来源 (例如 "Wikidata", "Wikipedia", "Web Search")'),
});

// 导出类型定义
export type PlaceInfo = z.infer<typeof PlaceInfoSchema>;

// 地点信息工具定义
const placeInfoTool: ToolDefinition = {
  toolName: 'getPlaceInfoQuery',

  isEnabled: enabledTools => {
    // 检查主工具是否启用
    const isPlaceInfoEnabled = enabledTools.includes(mapToolNameToEnabledTool('getPlaceInfoQuery'));

    // 至少需要启用主工具
    return isPlaceInfoEnabled;
  },

  createTool: (config: ToolConfig) => {
    return tool({
      description:
        '获取北欧特定城市、景点、地标的详细信息，包括介绍、历史背景、游玩小贴士、交通建议等',
      parameters: z.object({
        placeName: z.string().describe('需要查询信息的地点名称（如 "松恩峡湾", "特罗姆瑟"）'),
        language: z.string().optional().default('zh').describe('期望返回信息的语言，默认中文'),
      }),
      execute: async ({ placeName }, { toolCallId, abortSignal }) => {
        try {
          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'getPlaceInfoQuery',
              status: 'searching',
              message: `正在收集"${placeName}"的各方面信息...`,
              toolCallId,
            });
          }

          // 收集数据源
          const dataSources: string[] = [];
          let wikipediaData: {
            title?: string;
            extract?: string;
            description?: string;
            url?: string;
          } | null = null;
          let searchResults: Array<{
            domain?: string;
            title?: string;
            text?: string;
            highlights?: string[];
          }> = [];

          // 1. 从Wikipedia获取基本信息 - 安全处理API调用
          try {
            console.log(`正在从Wikipedia获取"${placeName}"摘要...`);

            // 尝试搜索相关页面
            const searchResult = await wikipediaClient.search({
              query: placeName,
              limit: 1,
            });

            // 确保有搜索结果并提取第一个结果的标题
            let pageTitle = null;

            // 尝试安全地访问searchResult的结构
            if (
              searchResult &&
              typeof searchResult === 'object' &&
              'query' in searchResult &&
              searchResult.query &&
              typeof searchResult.query === 'object' &&
              'search' in searchResult.query &&
              Array.isArray(searchResult.query.search) &&
              searchResult.query.search.length > 0 &&
              typeof searchResult.query.search[0] === 'object' &&
              'title' in searchResult.query.search[0]
            ) {
              pageTitle = searchResult.query.search[0].title;
            }

            if (pageTitle) {
              // 获取页面摘要
              const summary = await wikipediaClient.getPageSummary({
                title: pageTitle,
              });

              if (summary) {
                wikipediaData = {
                  title: summary.title || pageTitle,
                  extract: summary.extract || '',
                  description: summary.description || '',
                  url: summary.content_urls?.desktop?.page || '',
                };

                dataSources.push('Wikipedia');
                console.log(`成功获取Wikipedia数据: ${wikipediaData.title}`);
              }
            }
          } catch (error) {
            console.error('Wikipedia获取失败:', error);
          }

          // 2. 如果启用了Web搜索，进行一次基本搜索
          if (config.enabledTools.includes(mapToolNameToEnabledTool('webSearch'))) {
            try {
              const webSearchImpl = webSearchTool.createTool(config);
              const searchQuery = `${placeName} 旅游 景点 介绍 交通`;

              // 为了避免TypeScript错误，使用any类型执行网络搜索
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const webSearchExec = webSearchImpl as any;
              if (webSearchExec && typeof webSearchExec.execute === 'function') {
                const searchResult = await webSearchExec.execute(
                  { query: searchQuery, numResults: 5, useNeural: true },
                  { toolCallId, abortSignal, messages: [] }
                );

                if (
                  searchResult &&
                  typeof searchResult === 'object' &&
                  'results' in searchResult &&
                  Array.isArray(searchResult.results) &&
                  searchResult.results.length > 0
                ) {
                  searchResults = searchResult.results;
                  dataSources.push('Web Search');
                  console.log(`成功获取Web搜索结果: ${searchResults.length}个相关页面`);
                }
              }
            } catch (error) {
              console.error('Web搜索失败:', error);
            }
          }

          if (dataSources.length === 0) {
            throw new Error(`未能找到关于"${placeName}"的任何信息`);
          }

          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'getPlaceInfoQuery',
              status: 'processing',
              message: `已收集信息，正在整理"${placeName}"的详细攻略内容...`,
              toolCallId,
            });
          }

          // 构建提示
          let prompt = `为目的地"${placeName}"整理完整的旅游信息。以下是从多个来源收集的数据:\n\n`;

          // 添加Wikipedia数据
          if (wikipediaData) {
            prompt += `## Wikipedia描述:\n`;
            if (wikipediaData.extract) {
              prompt += `${wikipediaData.extract}\n\n`;
            }
            if (wikipediaData.description) {
              prompt += `简短描述: ${wikipediaData.description}\n\n`;
            }
            if (wikipediaData.url) {
              prompt += `维基百科链接: ${wikipediaData.url}\n\n`;
            }
          }

          // 添加搜索结果
          if (searchResults.length > 0) {
            prompt += `## Web搜索结果:\n\n`;
            searchResults.forEach((result, idx) => {
              if (typeof result === 'object' && result !== null) {
                prompt += `- 来源 ${idx + 1} [${result.domain || '未知来源'}]:\n`;
                if (result.title) prompt += `  标题: ${result.title}\n`;
                if (result.text) {
                  const truncatedText =
                    typeof result.text === 'string' && result.text.length > 300
                      ? result.text.substring(0, 300) + '...'
                      : result.text;
                  prompt += `  内容: ${truncatedText}\n`;
                }
                if (
                  result.highlights &&
                  Array.isArray(result.highlights) &&
                  result.highlights.length > 0
                ) {
                  prompt += `  亮点: ${result.highlights.join(' | ')}\n`;
                }
                prompt += '\n';
              }
            });
          }

          prompt += `
            请根据以上所有信息，生成一个关于"${placeName}"的完整、结构化的旅游信息对象。对象应该包含：

            1. 简要介绍
            2. 主要亮点和必看地点
            3. 实用旅行贴士
            4. 交通信息
            5. 最佳访问时间
            6. 估计参观时长
            7. 官方网站和其他重要链接
            8. 信息来源归属

            对于任何缺失的信息，请标注为未知，而不是编造。优先使用最新、最权威的信息源。`;

          // 调用LLM进行信息综合和结构化
          const { object } = await generateObject({
            model: registry.languageModel('anthropic:claude-3-5-sonnet-latest'),
            schema: PlaceInfoSchema,
            system: `你是一位旅游编辑专家，精通整理和结构化旅游目的地信息。
                    你的任务是根据提供的各种来源数据，为旅行者生成一个全面、实用且结构良好的目的地信息对象。
                    信息应该对计划旅行的人有实际帮助，并包含实用的细节。
                    如果来源数据之间有冲突，优先考虑最可靠和最近期的信息。
                    对于缺失的信息，明确标注为未知或不适用，而不是编造。
                    **特别注意：对于 'officialWebsite' 字段，只有在源数据中明确找到有效的URL时才包含此字段。如果没有找到有效的URL，请完全省略 'officialWebsite' 字段，不要填入'未知'或'不适用'等文字。**`,
            prompt,
          });

          // 确保sourceAttribution包含正确的数据源
          if (object && Array.isArray(object.sourceAttribution)) {
            for (const source of dataSources) {
              if (!object.sourceAttribution.includes(source)) {
                object.sourceAttribution.push(source);
              }
            }
          }

          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'getPlaceInfoQuery',
              status: 'complete',
              message: `已完成"${placeName}"旅游信息的整理`,
              toolCallId,
            });
          }

          // 返回结构化的地点信息
          return object;
        } catch (error) {
          console.error('获取地点信息失败:', error);
          if (config.dataStream) {
            config.dataStream.writeData({
              type: 'toolStatus',
              tool: 'getPlaceInfoQuery',
              status: 'error',
              message: `获取"${placeName}"信息失败: ${(error as Error).message}`,
              toolCallId,
            });
          }
          throw error;
        }
      },
    });
  },
};

export default placeInfoTool;
