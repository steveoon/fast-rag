import { tool, JSONValue } from 'ai';
import { z } from 'zod';
import { ToolDefinition, ToolConfig } from '../types';
import { registry } from '../../models-registry';
import { generateObject } from 'ai';
import { getExaMCPTools } from './clients';

// 定义操作类型枚举
const OPERATIONS = ['research_paper_search', 'github_search', 'crawling'] as const;

// 研究论文搜索结果可视化类型
export type ResearchPaperVisualization = {
  operation: string;
  query: string;
  papers: Array<{
    title: string;
    authors: string[];
    abstract: string;
    url: string;
    publishedDate?: string;
    citations?: number;
    venue?: string;
  }>;
};

// GitHub搜索结果可视化类型
export type GitHubSearchVisualization = {
  operation: string;
  query: string;
  repositories: Array<{
    name: string;
    owner: string;
    description: string;
    url: string;
    stars?: number;
    language?: string;
    lastUpdated?: string;
  }>;
};

// 网页爬取结果可视化类型
export type CrawlingVisualization = {
  operation: string;
  urls: string[];
  pages: Array<{
    url: string;
    title: string;
    content: string;
    links?: string[];
    images?: string[];
  }>;
};

// 格式化数据类型
type FormattedSearchData =
  | ResearchPaperVisualization
  | GitHubSearchVisualization
  | CrawlingVisualization
  | Record<string, unknown>;

// 工具状态消息类型
interface ToolStatusMessage {
  type: string;
  tool: string;
  status: string;
  message: string;
  toolCallId: string;
  meta?: Record<string, unknown>;
}

// 实现多维搜索工具
const multiDimensionalSearchTool: ToolDefinition = {
  toolName: 'multiDimensionalSearch',

  isEnabled: enabledTools => {
    try {
      // 使用直接检查，而不是通过映射函数
      return enabledTools.includes('multiDimensionalSearch');
    } catch (e) {
      console.warn('多维搜索工具映射错误:', e);
      return false;
    }
  },

  createTool: (config: ToolConfig) => {
    return tool({
      description: '多维搜索工具：执行学术论文搜索、GitHub仓库搜索或网页内容爬取',
      parameters: z.object({
        operation: z
          .enum(OPERATIONS)
          .describe('搜索操作类型：学术论文搜索、GitHub仓库搜索或网页爬取'),
        query: z.string().describe('搜索查询或URL，如果是crawling操作则可以是逗号分隔的多个URL'),
        numResults: z.number().optional().default(5).describe('返回结果数量（仅适用于搜索操作）'),
      }),
      execute: async ({ operation, query, numResults }, { toolCallId }) => {
        // 辅助函数：发送状态消息
        const sendStatus = (status: string, message: string, meta?: Record<string, unknown>) => {
          if (config.dataStream) {
            const statusData: ToolStatusMessage = {
              type: 'toolStatus',
              tool: 'multiDimensionalSearch',
              status,
              message,
              toolCallId,
              ...(meta ? { meta } : {}),
            };
            // 确保数据结构兼容JSONValue
            config.dataStream.writeData(JSON.parse(JSON.stringify(statusData)) as JSONValue);
          }
        };

        try {
          console.log(`执行多维搜索: ${operation} - "${query}"`);
          sendStatus('searching', `正在执行${operation}: "${query}"`);

          // 获取Exa MCP工具
          const exaTools = await getExaMCPTools();

          if (!exaTools || Object.keys(exaTools).length === 0) {
            sendStatus('error', 'Exa MCP工具获取失败');
            return { error: 'Exa MCP工具获取失败' };
          }

          console.log('可用的Exa工具:', Object.keys(exaTools));
          sendStatus('processing', `已连接Exa服务，正在执行${operation}...`);

          let result: unknown;
          switch (operation) {
            case 'research_paper_search':
              if (exaTools.research_paper_search) {
                result = await exaTools.research_paper_search.execute(
                  { query, numResults },
                  { toolCallId, messages: [] }
                );
              }
              break;
            case 'github_search':
              if (exaTools.github_search) {
                result = await exaTools.github_search.execute(
                  { query, numResults },
                  { toolCallId, messages: [] }
                );
              }
              break;
            case 'crawling':
              if (exaTools.crawling) {
                // 将逗号分隔的URL字符串转换为数组
                const urls = query.split(',').map(url => url.trim());

                if (urls.length === 0) {
                  sendStatus('error', '未提供有效的URL');
                  return { error: '未提供有效的URL' };
                }

                // 根据MCP crawling API的参数要求
                const url = urls.length === 1 ? urls[0] : urls[0]; // 暂时只取第一个URL
                result = await exaTools.crawling.execute({ url }, { toolCallId, messages: [] });
              }
              break;
          }

          if (!result) {
            sendStatus('noResults', `未能获取${operation}的结果`);
            return { error: `未能执行${operation}操作` };
          }

          sendStatus('formatting', `已获取原始数据，正在处理结果`, {
            operation,
            query,
          });

          // 根据操作类型选择不同的格式化处理
          let formattedData: FormattedSearchData;

          switch (operation) {
            case 'research_paper_search':
              formattedData = await formatResearchPaperResult(result, operation, query);
              break;
            case 'github_search':
              formattedData = await formatGitHubSearchResult(result, operation, query);
              break;
            case 'crawling': {
              const urls = query.split(',').map(url => url.trim());
              formattedData = await formatCrawlingResult(result, operation, urls);
              break;
            }
            default:
              formattedData = { operation, query, result };
          }

          // 计算结果摘要信息
          const summaryInfo = getSummaryInfo(operation, formattedData);

          sendStatus('complete', `${operation}数据处理完毕`, {
            operation,
            query,
            summary: summaryInfo,
          });

          return {
            ...result,
            formattedData,
            summary: summaryInfo,
          };
        } catch (error: unknown) {
          console.error(`多维搜索错误(${operation}):`, error);
          sendStatus('error', `搜索失败: ${(error as Error).message}`);
          return {
            error: `${operation}搜索失败`,
            message: (error as Error).message,
          };
        }
      },
    });
  },
};

// 辅助函数：格式化研究论文搜索结果
async function formatResearchPaperResult(
  result: unknown,
  operation: string,
  query: string
): Promise<ResearchPaperVisualization> {
  try {
    const { object } = await generateObject<ResearchPaperVisualization>({
      model: registry.languageModel('google/gemini-2.0-flash-exp'),
      schema: z.object({
        operation: z.string(),
        query: z.string(),
        papers: z.array(
          z.object({
            title: z.string(),
            authors: z.array(z.string()),
            abstract: z.string(),
            url: z.string(),
            publishedDate: z.string().optional(),
            citations: z.number().optional(),
            venue: z.string().optional(),
          })
        ),
      }),
      prompt: `
        你是一个帮助格式化Exa学术论文搜索结果的助手。
        以下是Exa API的响应:
        ${JSON.stringify(result)}
        
        请将响应格式化为以下结构的JSON:
        {
          "operation": "${operation}",
          "query": "${query}",
          "papers": [
            {
              "title": "论文标题",
              "authors": ["作者1", "作者2"],
              "abstract": "摘要内容",
              "url": "论文URL",
              "publishedDate": "发布日期"(可选),
              "citations": 引用次数(可选数值),
              "venue": "发表期刊/会议"(可选)
            }
          ]
        }
      `,
    });

    return object;
  } catch (error) {
    console.error('格式化研究论文结果失败:', error);
    return {
      operation,
      query,
      papers: [],
    };
  }
}

// 辅助函数：格式化GitHub搜索结果
async function formatGitHubSearchResult(
  result: unknown,
  operation: string,
  query: string
): Promise<GitHubSearchVisualization> {
  try {
    const { object } = await generateObject<GitHubSearchVisualization>({
      model: registry.languageModel('google/gemini-2.0-flash-exp'),
      schema: z.object({
        operation: z.string(),
        query: z.string(),
        repositories: z.array(
          z.object({
            name: z.string(),
            owner: z.string(),
            description: z.string(),
            url: z.string(),
            stars: z.number().optional(),
            language: z.string().optional(),
            lastUpdated: z.string().optional(),
          })
        ),
      }),
      prompt: `
        你是一个帮助格式化Exa GitHub搜索结果的助手。
        以下是Exa API的响应:
        ${JSON.stringify(result)}
        
        请将响应格式化为以下结构的JSON:
        {
          "operation": "${operation}",
          "query": "${query}",
          "repositories": [
            {
              "name": "仓库名称",
              "owner": "拥有者",
              "description": "仓库描述",
              "url": "仓库URL",
              "stars": 星标数(可选数值),
              "language": "主要编程语言"(可选),
              "lastUpdated": "最后更新时间"(可选)
            }
          ]
        }
      `,
    });

    return object;
  } catch (error) {
    console.error('格式化GitHub搜索结果失败:', error);
    return {
      operation,
      query,
      repositories: [],
    };
  }
}

// 辅助函数：格式化网页爬取结果
async function formatCrawlingResult(
  result: unknown,
  operation: string,
  urls: string[]
): Promise<CrawlingVisualization> {
  try {
    const { object } = await generateObject<CrawlingVisualization>({
      model: registry.languageModel('google/gemini-2.0-flash-exp'),
      schema: z.object({
        operation: z.string(),
        urls: z.array(z.string()),
        pages: z.array(
          z.object({
            url: z.string(),
            title: z.string(),
            content: z.string(),
            links: z.array(z.string()).optional(),
            images: z.array(z.string()).optional(),
          })
        ),
      }),
      prompt: `
        你是一个帮助格式化Exa网页爬取结果的助手。
        以下是Exa API的响应:
        ${JSON.stringify(result)}
        
        请将响应格式化为以下结构的JSON:
        {
          "operation": "${operation}",
          "urls": ${JSON.stringify(urls)},
          "pages": [
            {
              "url": "网页URL",
              "title": "网页标题",
              "content": "提取的主要内容",
              "links": ["链接1", "链接2"](可选),
              "images": ["图片URL1", "图片URL2"](可选)
            }
          ]
        }
      `,
    });

    return object;
  } catch (error) {
    console.error('格式化网页爬取结果失败:', error);
    return {
      operation,
      urls,
      pages: [],
    };
  }
}

// 辅助函数：获取结果摘要信息
function getSummaryInfo(
  operation: string,
  formattedData: FormattedSearchData
): string | Record<string, unknown> {
  switch (operation) {
    case 'research_paper_search': {
      const paperData = formattedData as ResearchPaperVisualization;
      if (paperData.papers && paperData.papers.length > 0) {
        return {
          paperCount: paperData.papers.length,
          recentPaper: paperData.papers[0].title,
        };
      }
      break;
    }
    case 'github_search': {
      const gitHubData = formattedData as GitHubSearchVisualization;
      if (gitHubData.repositories && gitHubData.repositories.length > 0) {
        return {
          repoCount: gitHubData.repositories.length,
          topRepo: gitHubData.repositories[0].name,
          owner: gitHubData.repositories[0].owner,
        };
      }
      break;
    }
    case 'crawling': {
      const crawlData = formattedData as CrawlingVisualization;
      if (crawlData.pages && crawlData.pages.length > 0) {
        return {
          urlCount: crawlData.urls.length,
          pageCount: crawlData.pages.length,
          pagesSummary: crawlData.pages.map(page => ({
            url: page.url,
            title: page.title,
          })),
        };
      }
      break;
    }
  }

  return '没有获取到有效数据';
}

export default multiDimensionalSearchTool;
