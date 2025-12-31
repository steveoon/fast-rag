import { tool } from 'ai';
import { z } from 'zod';
import { ToolDefinition, ToolConfig } from '../types';
import { exaClient } from './clients';
import type { exa } from '@agentic/exa';

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

          // 根据操作类型选择不同的格式化处理 (直接映射，无需 LLM)
          let formattedData: FormattedSearchData;
          const searchResult = result as exa.SearchResponse;

          switch (operation) {
            case 'web_search':
              formattedData = formatWebSearchResult(searchResult, operation, query);
              break;
            case 'code_context':
              formattedData = formatCodeContextResult(searchResult, operation, query);
              break;
            case 'company_research':
              formattedData = formatCompanyResearchResult(searchResult, operation, query);
              break;
            case 'crawling':
              formattedData = formatCrawlingResult(searchResult, operation, [query]);
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

// 辅助函数：格式化网页搜索结果 (直接映射，无需 LLM)
function formatWebSearchResult(
  result: exa.SearchResponse,
  operation: string,
  query: string
): WebSearchVisualization {
  return {
    operation,
    query,
    results: (result.results || []).map(item => ({
      title: item.title || '无标题',
      url: item.url,
      snippet: item.highlights?.[0] || item.text?.slice(0, 300) || '',
      publishedDate: item.publishedDate,
    })),
  };
}

// 辅助函数：格式化代码上下文搜索结果 (直接映射，无需 LLM)
function formatCodeContextResult(
  result: exa.SearchResponse,
  operation: string,
  query: string
): CodeContextVisualization {
  return {
    operation,
    query,
    results: (result.results || []).map(item => {
      // 从 URL 推断来源类型
      let source: string | undefined;
      if (item.url.includes('github.com')) source = 'github';
      else if (item.url.includes('stackoverflow.com')) source = 'stackoverflow';
      else if (item.url.includes('docs.') || item.url.includes('documentation')) source = 'docs';

      return {
        title: item.title || '无标题',
        url: item.url,
        snippet: item.highlights?.[0] || item.text?.slice(0, 300) || '',
        source,
      };
    }),
  };
}

// 辅助函数：格式化公司研究结果 (直接映射，无需 LLM)
function formatCompanyResearchResult(
  result: exa.SearchResponse,
  operation: string,
  query: string
): CompanyResearchVisualization {
  // 从搜索结果中提取公司信息
  const firstResult = result.results?.[0];

  return {
    operation,
    query,
    company: {
      name: query, // 使用查询作为公司名称
      description: firstResult?.highlights?.[0] || firstResult?.text?.slice(0, 500) || '暂无描述',
      website: firstResult?.url,
    },
  };
}

// 辅助函数：格式化网页爬取结果 (直接映射，无需 LLM)
function formatCrawlingResult(
  result: exa.SearchResponse,
  operation: string,
  urls: string[]
): CrawlingVisualization {
  return {
    operation,
    urls,
    pages: (result.results || []).map(item => ({
      url: item.url,
      title: item.title || '无标题',
      content: item.text?.slice(0, 2000) || '',
    })),
  };
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
