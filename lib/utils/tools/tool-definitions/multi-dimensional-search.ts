import { tool } from 'ai';
import { z } from 'zod';
import { ToolDefinition, ToolConfig } from '../types';
import { exaClient } from './clients';
import { createSearchFormatterAgent } from '../../agents';

// 定义操作类型枚举 (更新为最新的 Exa MCP 工具名称)
const OPERATIONS = [
  'web_search', // web_search_exa - 网页搜索
  'code_context', // get_code_context_exa - 代码上下文搜索 (GitHub、文档、StackOverflow)
  'crawling', // crawling - 网页爬取
  'company_research', // company_research - 公司研究
] as const;

// 网页搜索结果可视化类型
export type WebSearchVisualization = {
  operation: string;
  query: string;
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    publishedDate?: string;
  }>;
};

// 代码上下文搜索结果可视化类型 (替代原 GitHub 搜索)
export type CodeContextVisualization = {
  operation: string;
  query: string;
  results: Array<{
    title: string;
    url: string;
    snippet: string;
    source?: string; // github, docs, stackoverflow
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

// 公司研究结果可视化类型
export type CompanyResearchVisualization = {
  operation: string;
  query: string;
  company: {
    name: string;
    description: string;
    website?: string;
    industry?: string;
    employees?: string;
    founded?: string;
  };
};

// 格式化数据类型
type FormattedSearchData =
  | WebSearchVisualization
  | CodeContextVisualization
  | CrawlingVisualization
  | CompanyResearchVisualization
  | Record<string, unknown>;

// ==================== 格式化 Output Schemas ====================

// 网页搜索结果 Schema
const webSearchSchema = z.object({
  operation: z.string().describe('操作类型'),
  query: z.string().describe('查询内容'),
  results: z
    .array(
      z.object({
        title: z.string().describe('标题'),
        url: z.string().describe('URL'),
        snippet: z.string().describe('内容摘要'),
        publishedDate: z.string().optional().describe('发布日期'),
      })
    )
    .describe('搜索结果列表'),
});

// 代码上下文搜索结果 Schema
const codeContextSchema = z.object({
  operation: z.string().describe('操作类型'),
  query: z.string().describe('查询内容'),
  results: z
    .array(
      z.object({
        title: z.string().describe('标题'),
        url: z.string().describe('URL'),
        snippet: z.string().describe('代码或内容摘要'),
        source: z.string().optional().describe('来源类型 (github/docs/stackoverflow)'),
      })
    )
    .describe('代码上下文结果列表'),
});

// 公司研究结果 Schema
const companyResearchSchema = z.object({
  operation: z.string().describe('操作类型'),
  query: z.string().describe('查询内容'),
  company: z.object({
    name: z.string().describe('公司名称'),
    description: z.string().describe('公司描述'),
    website: z.string().optional().describe('官网'),
    industry: z.string().optional().describe('行业'),
    employees: z.string().optional().describe('员工规模'),
    founded: z.string().optional().describe('成立时间'),
  }),
});

// 网页爬取结果 Schema
const crawlingSchema = z.object({
  operation: z.string().describe('操作类型'),
  urls: z.array(z.string()).describe('爬取的URL列表'),
  pages: z
    .array(
      z.object({
        url: z.string().describe('网页URL'),
        title: z.string().describe('网页标题'),
        content: z.string().describe('提取的主要内容'),
        links: z.array(z.string()).optional().describe('页面中的链接'),
        images: z.array(z.string()).optional().describe('页面中的图片URL'),
      })
    )
    .describe('爬取的页面列表'),
});

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
      description:
        '多维搜索工具：执行网页搜索、代码上下文搜索(GitHub/文档/StackOverflow)、网页爬取或公司研究',
      inputSchema: z.object({
        operation: z
          .enum(OPERATIONS)
          .describe(
            '搜索操作类型：web_search(网页搜索)、code_context(代码上下文)、crawling(网页爬取)、company_research(公司研究)'
          ),
        query: z.string().describe('搜索查询或URL，如果是crawling操作则为要爬取的URL'),
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
            config.dataStream.write?.({
              type: 'data',
              value: [JSON.parse(JSON.stringify(statusData))],
            });
          }
        };

        try {
          console.log(`执行多维搜索: ${operation} - "${query}"`);
          sendStatus('searching', `正在执行${operation}: "${query}"`);

          // 直接使用 Exa API 客户端
          sendStatus('processing', `已连接Exa服务，正在执行${operation}...`);

          let result: unknown;
          switch (operation) {
            case 'web_search':
              // 使用 Exa search API 进行网页搜索
              result = await exaClient.search({
                query,
                numResults,
              });
              break;
            case 'code_context':
              // 使用 category: 'github' 进行代码相关搜索
              result = await exaClient.search({
                query,
                numResults,
                category: 'github',
              });
              break;
            case 'company_research':
              // 使用 category: 'company' 进行公司研究
              result = await exaClient.search({
                query,
                numResults: 10,
                category: 'company',
              });
              break;
            case 'crawling': {
              // 使用 getContents 获取网页内容
              const url = query.trim();
              if (!url) {
                sendStatus('error', '未提供有效的URL');
                return { error: '未提供有效的URL' };
              }
              result = await exaClient.getContents({ ids: [url] });
              break;
            }
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
            case 'web_search':
              formattedData = await formatWebSearchResult(result, operation, query);
              break;
            case 'code_context':
              formattedData = await formatCodeContextResult(result, operation, query);
              break;
            case 'company_research':
              formattedData = await formatCompanyResearchResult(result, operation, query);
              break;
            case 'crawling':
              formattedData = await formatCrawlingResult(result, operation, [query]);
              break;
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

// 辅助函数：格式化网页搜索结果
async function formatWebSearchResult(
  result: unknown,
  operation: string,
  query: string
): Promise<WebSearchVisualization> {
  try {
    const { output } = await createSearchFormatterAgent(webSearchSchema).generate({
      prompt: `以下是Exa API的响应:
${JSON.stringify(result)}

操作类型: ${operation}
查询内容: ${query}

请格式化`,
    });

    return output;
  } catch (error) {
    console.error('格式化网页搜索结果失败:', error);
    return {
      operation,
      query,
      results: [],
    };
  }
}

// 辅助函数：格式化代码上下文搜索结果
async function formatCodeContextResult(
  result: unknown,
  operation: string,
  query: string
): Promise<CodeContextVisualization> {
  try {
    const { output } = await createSearchFormatterAgent(codeContextSchema).generate({
      prompt: `以下是Exa API的响应:
${JSON.stringify(result)}

操作类型: ${operation}
查询内容: ${query}

请格式化`,
    });

    return output;
  } catch (error) {
    console.error('格式化代码上下文结果失败:', error);
    return {
      operation,
      query,
      results: [],
    };
  }
}

// 辅助函数：格式化公司研究结果
async function formatCompanyResearchResult(
  result: unknown,
  operation: string,
  query: string
): Promise<CompanyResearchVisualization> {
  try {
    const { output } = await createSearchFormatterAgent(companyResearchSchema).generate({
      prompt: `以下是Exa API的响应:
${JSON.stringify(result)}

操作类型: ${operation}
查询内容: ${query}

请格式化`,
    });

    return output;
  } catch (error) {
    console.error('格式化公司研究结果失败:', error);
    return {
      operation,
      query,
      company: {
        name: '',
        description: '',
      },
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
    const { output } = await createSearchFormatterAgent(crawlingSchema).generate({
      prompt: `以下是Exa API的响应:
${JSON.stringify(result)}

操作类型: ${operation}
爬取URL: ${JSON.stringify(urls)}

请格式化`,
    });

    return output;
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
    case 'web_search': {
      const webData = formattedData as WebSearchVisualization;
      if (webData.results && webData.results.length > 0) {
        return {
          resultCount: webData.results.length,
          topResult: webData.results[0].title,
        };
      }
      break;
    }
    case 'code_context': {
      const codeData = formattedData as CodeContextVisualization;
      if (codeData.results && codeData.results.length > 0) {
        return {
          resultCount: codeData.results.length,
          topResult: codeData.results[0].title,
          source: codeData.results[0].source,
        };
      }
      break;
    }
    case 'company_research': {
      const companyData = formattedData as CompanyResearchVisualization;
      if (companyData.company && companyData.company.name) {
        return {
          companyName: companyData.company.name,
          industry: companyData.company.industry,
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
