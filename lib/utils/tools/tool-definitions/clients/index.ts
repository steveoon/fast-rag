/* eslint-disable @typescript-eslint/no-explicit-any */
import { WeatherClient } from '@agentic/weather';
import { WikipediaClient } from '@agentic/wikipedia';
import { WikidataClient } from '@agentic/wikidata';
import { ExaClient } from '@agentic/exa';
import { EventEmitter } from 'events';
import { createMCPClient } from '@ai-sdk/mcp';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CozeAPI } from '@coze/api';

// 增加最大监听器数量，避免警告
EventEmitter.defaultMaxListeners = 20;

// 单例模式实现
class ClientManager {
  private static instance: ClientManager;
  private _weatherClient: WeatherClient | null = null;
  private _wikipediaClient: WikipediaClient | null = null;
  private _exaClient: ExaClient | null = null;
  private _wikidataClient: WikidataClient | null = null;
  private _googleMapsMCPClient: any | null = null; // 使用any暂时避免类型问题
  private _exaMCPClient: any | null = null; // ExaMCP客户端
  private _cozeClient: CozeAPI | null = null; // Coze API客户端

  private constructor() {
    // 私有构造函数，防止外部直接实例化

    // 添加进程退出时的资源清理
    process.on('beforeExit', async () => {
      await this.cleanupResources();
    });
  }

  // 资源清理方法
  private async cleanupResources(): Promise<void> {
    if (this._googleMapsMCPClient) {
      try {
        await this._googleMapsMCPClient.close();
        this._googleMapsMCPClient = null;
        console.log('Google Maps MCP客户端已关闭');
      } catch (error) {
        console.error('关闭Google Maps MCP客户端出错:', error);
      }
    }

    if (this._exaMCPClient) {
      try {
        if (this._exaMCPClient.close) {
          await this._exaMCPClient.close();
        }
        this._exaMCPClient = null;
        console.log('Exa MCP客户端已关闭');
      } catch (error) {
        console.error('关闭Exa MCP客户端出错:', error);
      }
    }
  }

  public static getInstance(): ClientManager {
    if (!ClientManager.instance) {
      ClientManager.instance = new ClientManager();
    }
    return ClientManager.instance;
  }

  public get weatherClient(): WeatherClient {
    if (!this._weatherClient) {
      this._weatherClient = new WeatherClient();
    }
    return this._weatherClient;
  }

  public get wikipediaClient(): WikipediaClient {
    if (!this._wikipediaClient) {
      this._wikipediaClient = new WikipediaClient({
        apiUserAgent: process.env.WIKIPEDIA_API_USER_AGENT,
      });
    }
    return this._wikipediaClient;
  }

  public get exaClient(): ExaClient {
    if (!this._exaClient) {
      this._exaClient = new ExaClient({
        apiKey: process.env.EXA_API_KEY,
      });
    }
    return this._exaClient;
  }

  public get wikidataClient(): WikidataClient {
    if (!this._wikidataClient) {
      this._wikidataClient = new WikidataClient();
    }
    return this._wikidataClient;
  }

  public get cozeClient(): CozeAPI {
    if (!this._cozeClient) {
      const apiKey = process.env.COZE_API_KEY;
      if (!apiKey) {
        console.warn('COZE_API_KEY未设置，使用空字符串');
      }
      this._cozeClient = new CozeAPI({
        token: apiKey || '',
        baseURL: 'https://api.coze.cn',
      });
      console.log('Coze API客户端已创建');
    }
    return this._cozeClient;
  }

  public async getGoogleMapsMCPClient() {
    if (!this._googleMapsMCPClient) {
      const apiKey = process.env.GOOGLE_MAP_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_MAP_API_KEY未设置');
      }
      console.log('GOOGLE_MAP_API_KEY:', '...' + apiKey.substring(apiKey.length - 6));

      const transport = new StdioClientTransport({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-google-maps'],
        env: { GOOGLE_MAPS_API_KEY: apiKey },
      });

      this._googleMapsMCPClient = await createMCPClient({
        transport,
      });

      console.log('Google Maps MCP客户端已创建');
    }

    return this._googleMapsMCPClient;
  }

  // 提供一个获取Google Maps工具的快捷方法
  public async getGoogleMapsMCPTools(schemas?: Record<string, any>) {
    const client = await this.getGoogleMapsMCPClient();
    return schemas ? await client.tools({ schemas }) : await client.tools();
  }

  // 关闭谷歌地图客户端方法
  public async closeGoogleMapsMCPClient() {
    if (this._googleMapsMCPClient) {
      await this._googleMapsMCPClient.close();
      this._googleMapsMCPClient = null;
      console.log('Google Maps MCP客户端已手动关闭');
    }
  }

  // 获取Exa MCP客户端
  public async getExaMCPClient() {
    if (!this._exaMCPClient) {
      const apiKey = process.env.EXA_API_KEY;
      if (!apiKey) {
        throw new Error('EXA_API_KEY未设置');
      }
      console.log('EXA_API_KEY:', '...' + apiKey.substring(apiKey.length - 6));

      const transport = new StdioClientTransport({
        command: 'npx',
        args: [
          '-y',
          'exa-mcp-server',
          '--tools=web_search_exa,research_paper_search,company_research,crawling,competitor_finder,linkedin_search,wikipedia_search_exa,github_search',
        ],
        env: { EXA_API_KEY: apiKey },
      });

      this._exaMCPClient = await createMCPClient({
        transport,
      });

      console.log('Exa MCP客户端已创建');
    }

    return this._exaMCPClient;
  }

  // 获取Exa MCP工具
  public async getExaMCPTools() {
    const client = await this.getExaMCPClient();

    try {
      // 直接获取所有工具，而不是尝试通过getTool获取单个工具
      const tools = await client.tools();
      console.log(`已获取Exa MCP工具列表: ${Object.keys(tools).join(', ')}`);
      return tools;
    } catch (error) {
      console.error('获取Exa MCP工具失败:', error);
      return {};
    }
  }

  // 关闭Exa MCP客户端
  public async closeExaMCPClient() {
    if (this._exaMCPClient) {
      if (this._exaMCPClient.close) {
        await this._exaMCPClient.close();
      }
      this._exaMCPClient = null;
      console.log('Exa MCP客户端已手动关闭');
    }
  }
}

// 导出单例实例
const clientManager = ClientManager.getInstance();

export const weatherClient = clientManager.weatherClient;
export const wikipediaClient = clientManager.wikipediaClient;
export const exaClient = clientManager.exaClient;
export const wikidataClient = clientManager.wikidataClient;
export const cozeClient = clientManager.cozeClient;

// MCP客户端需要异步获取，不能直接导出
export const getGoogleMapsMCPClient = () => clientManager.getGoogleMapsMCPClient();
export const getGoogleMapsMCPTools = (schemas?: Record<string, any>) =>
  clientManager.getGoogleMapsMCPTools(schemas);
export const closeGoogleMapsMCPClient = () => clientManager.closeGoogleMapsMCPClient();

// Exa MCP客户端相关函数导出
export const getExaMCPClient = () => clientManager.getExaMCPClient();
export const getExaMCPTools = () => clientManager.getExaMCPTools();
export const closeExaMCPClient = () => clientManager.closeExaMCPClient();
