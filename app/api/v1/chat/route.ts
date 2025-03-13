import { NextResponse } from 'next/server';
import {
  streamText,
  tool,
  createDataStreamResponse,
  generateObject,
  ToolResult,
  ToolSet,
} from 'ai';
import { z } from 'zod';
import { registry } from '@/lib/utils/models-registry';
import { queryEmbeddings } from '@/lib/actions';
import { handleError, extractApiKey, validateClient } from '@/lib/utils';
import { CustomError } from '@/types';
import { weatherClient, exaClient, wikidataClient } from '@/lib/clients';
import { retryRateLimited } from '@/lib/utils/retry';
import { exa } from '@agentic/exa';
import { wikidata } from '@agentic/wikidata';

// 定义工具类型
const ENABLED_TOOLS = [
  'knowledgeBase',
  'webSearch',
  'weather',
  'wikidata',
  'smartWikidata',
] as const;
type EnabledToolType = (typeof ENABLED_TOOLS)[number];

// 定义分析工具名称
const ANALYSIS_TOOLS = [
  'queryKnowledgeBase',
  'getWeather',
  'webSearch',
  'wikidataGetEntity',
  'smartWikidataQuery',
] as const;
type AnalysisToolType = (typeof ANALYSIS_TOOLS)[number];

// 定义请求体的验证模式
const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
      })
    )
    .nonempty('至少需要一条消息'),
  docs: z.array(z.string()).optional(),
  docVersions: z.array(z.string()).optional(),
  similarityThreshold: z.number().min(0).max(1).optional(),
  model: z.string().optional().default('openai:gpt-4o-2024-08-06'),
  enabledTools: z
    .array(z.enum(ENABLED_TOOLS))
    .optional()
    .default(['knowledgeBase', 'smartWikidata']),
  maxSteps: z.number().optional().default(5),
});

// 工具名称映射函数
function mapToolNameToEnabledTool(toolName: AnalysisToolType): EnabledToolType {
  // 处理工具名称和enabledTools中名称的映射
  if (toolName === 'getWeather') {
    return 'weather';
  } else if (toolName === 'queryKnowledgeBase') {
    return 'knowledgeBase';
  } else if (toolName === 'webSearch') {
    return 'webSearch';
  } else if (toolName === 'wikidataGetEntity') {
    return 'wikidata';
  } else if (toolName === 'smartWikidataQuery') {
    return 'smartWikidata';
  }
  // 安全地处理默认情况
  throw new Error(`无法映射工具名称: ${toolName}`);
}

// 辅助函数：格式化Wikidata属性为可读格式
function formatWikidataProperties(entity: wikidata.SimplifiedEntity | null | undefined) {
  if (!entity || !entity.claims) {
    return {};
  }

  // 提取一些常见的属性（可以根据需要扩展）
  const commonProps: Record<string, unknown> = {};

  // 常见属性的Property ID映射
  const propMap: Record<string, string> = {
    P31: '类型/实例',
    P21: '性别',
    P27: '国籍',
    P569: '出生日期',
    P570: '死亡日期',
    P19: '出生地',
    P20: '死亡地',
    P106: '职业',
    P18: '图片',
    P856: '官方网站',
    P1559: '名称',
    P2561: '名称',
    P571: '创建/成立日期',
    P580: '开始时间',
    P582: '结束时间',
    P625: '地理坐标',
    P131: '行政区划',
    P17: '国家',
    P1082: '人口',
    P281: '邮政编码',
    P1448: '官方名称',
    P577: '出版日期',
    P50: '作者',
    P57: '导演',
    P58: '剧本作者',
    P161: '演员',
    P175: '表演者',
    P407: '语言',
    P495: '原产国',
    P136: '流派',
    P166: '获奖',
    P276: '位置',
    P937: '工作地点',
    P36: '首都',
    P1376: '首都',
  };

  // 处理每个属性
  Object.entries(entity.claims).forEach(([propId, claims]) => {
    const propName = propMap[propId] || propId;
    if (Array.isArray(claims) && claims.length > 0) {
      // 如果一个属性有多个值，作为数组存储
      commonProps[propName] = claims.map((claim: wikidata.Claim) => {
        if (typeof claim.value === 'string') {
          return claim.value;
        }
        return claim;
      });

      // 如果只有一个值，直接存储
      if (
        Array.isArray(commonProps[propName]) &&
        (commonProps[propName] as unknown[]).length === 1
      ) {
        commonProps[propName] = (commonProps[propName] as unknown[])[0];
      }
    }
  });

  return {
    id: entity.id,
    label: entity.labels?.zh || entity.labels?.en,
    description: entity.descriptions?.zh || entity.descriptions?.en,
    properties: commonProps,
  };
}

// 辅助函数：从文本中提取Wikidata实体ID
function extractEntityId(text: string): string | null {
  // 使用更宽松的正则表达式匹配Wikidata ID
  const patterns = [
    /\bQ\d+\b/g, // 标准格式 Q + 数字
    /wikidata\.org\/entity\/(Q\d+)/i, // 实体URL格式
    /wikidata\.org\/wiki\/(Q\d+)/i, // Wiki URL格式
    /\/([QP]\d+)(?:\W|$)/, // 路径末尾的ID
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      return matches[0].replace(/^\//, ''); // 移除可能的前导斜杠
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const apiKey = extractApiKey(request);
    const client = await validateClient(apiKey);
    if (!client) {
      throw new CustomError('非法请求', 'UN_AUTH_REQUEST');
    }

    const body = await request.json();
    const { messages, docs, docVersions, similarityThreshold, model, enabledTools, maxSteps } =
      chatRequestSchema.parse(body);

    return createDataStreamResponse({
      execute: async dataStream => {
        dataStream.writeData({
          type: 'text',
          text: 'PROCESS START',
        });

        // 初始化工具集
        const allTools: ToolSet = {};

        if (enabledTools.includes('knowledgeBase')) {
          allTools.queryKnowledgeBase = tool({
            description: `从知识库中检索与用户问题相关的信息。当用户询问特定领域知识或需要参考内部文档时使用。`,
            parameters: z.object({
              query: z.string().describe('用户的问题或查询内容'),
            }),
            execute: async ({ query }) => {
              console.log('查询知识库:', query);
              const queryRes = await queryEmbeddings({
                question: query,
                clientId: client.id,
                docs,
                docVersions,
                similarityThreshold,
              });
              return queryRes;
            },
          });
        }

        if (enabledTools.includes('weather')) {
          allTools.getWeather = tool({
            description: '获取特定城市的天气信息，城市名称必须转换为英文',
            parameters: z.object({
              city: z.string().describe('城市名称，必须转换为英文'),
            }),
            execute: async ({ city }) => {
              return await weatherClient.getCurrentWeather(city);
            },
          });
        }

        if (enabledTools.includes('wikidata')) {
          allTools.wikidataGetEntity = tool({
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
                dataStream.writeData({
                  type: 'toolStatus',
                  tool: 'wikidataGetEntity',
                  status: 'retrieving',
                  message: `正在获取Wikidata实体(${id})...`,
                });

                // 获取Wikidata实体
                const entity = await retryRateLimited(() =>
                  wikidataClient.getEntityById({ id, languages })
                );

                dataStream.writeData({
                  type: 'toolStatus',
                  tool: 'wikidataGetEntity',
                  status: 'complete',
                  message: `已获取Wikidata实体: ${entity.labels?.zh || entity.labels?.en || id}`,
                });

                // 格式化Wikidata实体属性为易读格式
                const formattedProps = formatWikidataProperties(entity);

                return {
                  entity,
                  formattedProperties: formattedProps,
                };
              } catch (error) {
                console.error('Wikidata实体获取错误:', error);
                dataStream.writeData({
                  type: 'toolStatus',
                  tool: 'wikidataGetEntity',
                  status: 'error',
                  message: `获取实体失败: ${(error as Error).message}`,
                });
                return {
                  error: '获取实体失败',
                  message: (error as Error).message,
                };
              }
            },
          });
        }

        if (enabledTools.includes('webSearch')) {
          allTools.webSearch = tool({
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
                dataStream.writeData({
                  type: 'toolStatus',
                  tool: 'webSearch',
                  status: 'searching',
                  message: `正在搜索: "${query}"`,
                });

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
                  dataStream.writeData({
                    type: 'toolStatus',
                    tool: 'webSearch',
                    status: 'noResults',
                    message: '未找到相关结果',
                  });
                  return { results: [], message: '未找到相关信息' };
                }

                const relevantResults = searchResults.results.slice(0, numResults);
                const resultIds = relevantResults.map(result => result.id);

                dataStream.writeData({
                  type: 'toolStatus',
                  tool: 'webSearch',
                  status: 'retrieving',
                  message: `找到 ${relevantResults.length} 个相关结果，正在获取详细内容...`,
                });

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

                dataStream.writeData({
                  type: 'toolStatus',
                  tool: 'webSearch',
                  status: 'complete',
                  message: `已获取 ${processedResults.length} 个网页内容`,
                  meta: {
                    resultCount: processedResults.length,
                    sources: processedResults.map(r => ({ title: r.title, url: r.url })),
                  },
                });

                return {
                  results: processedResults,
                  message: `找到 ${processedResults.length} 个相关结果`,
                  searchQuery: query,
                };
              } catch (error) {
                console.error('网络搜索错误:', error);
                dataStream.writeData({
                  type: 'toolStatus',
                  tool: 'webSearch',
                  status: 'error',
                  message: `搜索失败: ${(error as Error).message}`,
                });
                return {
                  error: '搜索失败',
                  message: (error as Error).message,
                  results: [],
                };
              }
            },
          });
        }

        if (enabledTools.includes('smartWikidata')) {
          allTools.smartWikidataQuery = tool({
            description:
              '智能查询Wikidata实体，可以通过名称或描述查找并获取实体数据，无需事先知道实体ID',
            parameters: z.object({
              query: z
                .string()
                .describe('要查询的实体名称或描述，如"苏东坡"、"阿尔伯特·爱因斯坦"等'),
              languages: z
                .array(z.string())
                .optional()
                .default(['zh', 'en'])
                .describe('返回数据的语言代码'),
            }),
            execute: async ({ query, languages }) => {
              try {
                dataStream.writeData({
                  type: 'toolStatus',
                  tool: 'smartWikidataQuery',
                  status: 'searching',
                  message: `正在查找"${query}"的Wikidata ID...`,
                });

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
                      model: registry.languageModel('openai:gpt-4o-mini'), // 使用较小模型节省tokens
                      schema: z.object({
                        englishName: z.string().describe('实体的英文名称或翻译'),
                        confidence: z.number().min(0).max(10).describe('翻译准确度的信心值(0-10)'),
                      }),
                      prompt: `请将以下中文实体名称翻译成英文，返回最准确的英文名称:
                      
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
                      text: { maxCharacters: 8000 },
                    },
                  });

                  if (searchResults.results && searchResults.results.length > 0) {
                    // 获取完整内容以查找ID
                    const resultIds = searchResults.results.map(result => result.id);
                    const contentsResponse = await exaClient.getContents({
                      ids: resultIds as [string, ...string[]],
                      text: { maxCharacters: 10000 },
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
                  dataStream.writeData({
                    type: 'toolStatus',
                    tool: 'smartWikidataQuery',
                    status: 'error',
                    message: `无法找到"${query}"的Wikidata ID`,
                  });
                  return {
                    error: '查找失败',
                    message: `无法找到"${query}"的Wikidata ID`,
                    searchResults: searchedContent ? { content: searchedContent } : undefined,
                  };
                }

                // 获取实体数据
                dataStream.writeData({
                  type: 'toolStatus',
                  tool: 'smartWikidataQuery',
                  status: 'retrieving',
                  message: `找到ID(${entityId})，正在获取Wikidata实体数据...`,
                });

                const entity = await retryRateLimited(() =>
                  wikidataClient.getEntityById({ id: entityId as string, languages })
                );

                // 格式化数据并返回
                const formattedProps = formatWikidataProperties(entity);

                dataStream.writeData({
                  type: 'toolStatus',
                  tool: 'smartWikidataQuery',
                  status: 'complete',
                  message: `已获取"${query}"(${entityId})的Wikidata数据`,
                });

                return {
                  success: true,
                  entityId,
                  entity,
                  formattedProperties: formattedProps,
                  usedQuery,
                };
              } catch (error) {
                console.error('智能Wikidata查询错误:', error);
                dataStream.writeData({
                  type: 'toolStatus',
                  tool: 'smartWikidataQuery',
                  status: 'error',
                  message: `查询失败: ${(error as Error).message}`,
                });
                return {
                  error: '查询失败',
                  message: (error as Error).message,
                };
              }
            },
          });
        }

        // 步骤1: 查询分析 - 在streamText之前进行
        const { object: queryAnalysis } = await generateObject({
          model: registry.languageModel(model),
          schema: z.object({
            queryType: z.enum([
              'factual', // 事实性查询
              'opinion', // 观点类查询
              'weather', // 天气查询
              'knowledge', // 知识库查询
              'current', // 当前事件/最新信息
              'technical', // 技术类问题
              'comparison', // 比较分析
              'historical', // 历史信息
            ]),
            requiredTools: z.array(z.enum(ANALYSIS_TOOLS)),
            reasoning: z.string(),
          }),
          prompt: `分析以下用户查询：
          ${messages[messages.length - 1].content}
          
          确定查询类型和需要使用的工具:
          1. queryType: 选择最匹配的查询类型
             - factual: 寻找事实信息
             - opinion: 寻求观点或评价
             - weather: 天气查询
             - knowledge: 专业知识或概念解释
             - current: 最新事件、新闻或趋势
             - technical: 技术问题或具体方法
             - comparison: 对比或比较分析
             - historical: 历史事件或过去的信息
          
          2. requiredTools: 选择解答问题所需的工具
             - queryKnowledgeBase: 适用于内部文档和专有知识
             - getWeather: 适用于天气查询
             - webSearch: 适用于需要最新信息、事实核查、流行话题
             - smartWikidataQuery: 适用于需要结构化事实数据的情况，如人物信息、地点数据等（首选）
             - wikidataGetEntity: 仅当已知具体Wikidata实体ID时使用（极少用到）
                    
          3. reasoning: 说明你的推理过程

          重要提示：对于查询人物、地点、组织等实体信息时，应优先选择smartWikidataQuery而非wikidataGetEntity。
          `,
        });

        console.log('查询分析:', queryAnalysis);

        // 步骤2: 增强工具选择逻辑
        const selectedTools: ToolSet = {};

        // 基于查询类型添加首选工具
        if (
          queryAnalysis.queryType === 'current' ||
          (queryAnalysis.queryType === 'factual' &&
            !queryAnalysis.requiredTools.includes('queryKnowledgeBase'))
        ) {
          // 当前事件和一些事实查询默认优先使用web搜索
          if (enabledTools.includes('webSearch') && allTools.webSearch) {
            selectedTools.webSearch = allTools.webSearch;
          }
        }

        // 特殊处理：当检测到需要使用wikidataGetEntity时，优先使用smartWikidataQuery替代
        const optimizedRequiredTools = queryAnalysis.requiredTools.map(toolName => {
          if (toolName === 'wikidataGetEntity' && enabledTools.includes('smartWikidata')) {
            console.log('自动将wikidataGetEntity工具替换为smartWikidataQuery');
            return 'smartWikidataQuery' as const;
          }
          return toolName;
        });

        // 添加分析推荐的工具
        optimizedRequiredTools.forEach(toolName => {
          const mappedToolName = mapToolNameToEnabledTool(toolName);
          if (allTools[toolName] && enabledTools.includes(mappedToolName)) {
            selectedTools[toolName] = allTools[toolName];
          }
        });

        // 确保至少有一个工具可用
        if (Object.keys(selectedTools).length === 0) {
          // 回退到知识库工具
          if (enabledTools.includes('knowledgeBase') && allTools.queryKnowledgeBase) {
            selectedTools.queryKnowledgeBase = allTools.queryKnowledgeBase;
          }
        }

        console.log('选择的工具:', Object.keys(selectedTools));

        const answer = streamText({
          system: `你是一个智能助手，能够根据用户的问题自主决定使用哪些工具来获取信息。
  
                  可用工具:
                  ${Object.keys(selectedTools)
                    .map(tool => {
                      if (tool === 'webSearch') {
                        return `- webSearch: 用于在互联网上搜索最新、最相关的信息。这是获取时事、最新发展和事实验证的首选工具`;
                      } else if (tool === 'wikidataGetEntity') {
                        return `- wikidataGetEntity: 用于获取Wikidata中的结构化实体数据，包含属性、关系等信息。适合查询具体的人物、地点、组织等实体的详细信息，但需要知道实体ID`;
                      } else if (tool === 'smartWikidataQuery') {
                        return `- smartWikidataQuery: 智能查询Wikidata实体，只需提供实体名称（如"苏东坡"）即可获取结构化数据，无需事先知道实体ID`;
                      } else {
                        return `- ${tool}`;
                      }
                    })
                    .join('\n')}
                  
                  工作流程:
                  1. 分析用户问题，确定需要使用哪些工具
                  2. 调用相应工具获取信息
                  3. 综合所有信息提供最终答案
                  
                  Wikidata工具使用指南:
                  - 对于需要事实信息的查询（如人物、地点、组织等），优先使用smartWikidataQuery工具
                  - 只有在已知实体ID的情况下，才直接使用wikidataGetEntity工具
                  - Wikidata实体ID通常以Q开头，如Q42代表"道格拉斯·亚当斯"
                  
                  webSearch工具使用指南:
                  - 对于需要最新信息的查询，优先使用webSearch
                  - 在搜索结果中寻找多个来源的共识，识别可靠的信息
                  - 检查搜索结果的发布日期，优先参考最新的信息
                  - 当结果包含数字、统计数据或具体观点时，始终标明信息来源
                  
                  回答要求:
                  - 回答要基于工具调用获取的信息
                  - 如果工具调用没有返回相关信息，请诚实告知用户"抱歉，我无法找到相关信息"
                  - 回答要简洁明了，逻辑清晰
                  - 如果信息来自多个来源，请在回答中注明信息来源
                  - 使用webSearch工具时，请在引用信息后使用引用标记，例如："根据搜索结果[1]，..."
                  - 如果多个搜索结果提供相似信息，可以综合引用："根据多个来源[1][2][3]，..."
                  - 确保提供的信息是准确的，避免添加不存在于原始内容中的细节
                  - 当搜索结果有冲突时，指出不同来源的差异，而不是随意选择一个`,
          model: registry.languageModel(model),
          messages: messages,
          tools: selectedTools,
          toolChoice: 'auto',
          maxSteps,
          onStepFinish: async ({ text, toolResults, usage, stepType }) => {
            const toolResult = toolResults.map((result: ToolResult<string, unknown, unknown>) => ({
              tool: result.toolName,
              result: JSON.stringify(result.result),
            }));

            console.log(`步骤 ${stepType} 完成`, { text, toolResult, usage });

            dataStream.writeData({
              type: 'stepComplete',
              stepType,
              hasToolCall: toolResult.length > 0,
              tool: toolResult.map(t => t.tool),
              text: text || null,
            });
          },
          onFinish: async ({ toolResults, usage }) => {
            console.log('流程结束', { usage });
            dataStream.writeMessageAnnotation({
              type: 'end',
              metadata: {
                usage,
                toolCalls: toolResults.length,
              },
            });
          },
        });

        answer.mergeIntoDataStream(dataStream);
      },
    });
  } catch (error) {
    const { message, code, details } = handleError(error);
    const status =
      code === 'UNEXPECTED_ERROR' || code === 'UNKNOWN_ERROR'
        ? 500
        : code === 'VALIDATION_ERROR'
          ? 400
          : 400;
    return NextResponse.json({ error: message, details, code }, { status });
  }
}
