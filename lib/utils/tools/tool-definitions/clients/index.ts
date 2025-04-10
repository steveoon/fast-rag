/* eslint-disable @typescript-eslint/no-explicit-any */
import { WeatherClient } from '@agentic/weather';
import { WikipediaClient } from '@agentic/wikipedia';
import { WikidataClient } from '@agentic/wikidata';
import { ExaClient } from '@agentic/exa';
import { EventEmitter } from 'events';
import { experimental_createMCPClient } from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';

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

  public async getGoogleMapsMCPClient() {
    if (!this._googleMapsMCPClient) {
      const apiKey = process.env.GOOGLE_MAP_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_MAP_API_KEY未设置');
      }
      console.log('GOOGLE_MAP_API_KEY:', '...' + apiKey.substring(apiKey.length - 6));

      const transport = new Experimental_StdioMCPTransport({
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-google-maps'],
        env: { GOOGLE_MAPS_API_KEY: apiKey },
      });

      this._googleMapsMCPClient = await experimental_createMCPClient({
        transport,
      });

      console.log('Google Maps MCP客户端已创建');
    }

    return this._googleMapsMCPClient;
  }

  // 提供一个获取Google Maps工具的快捷方法
  public async getGoogleMapsMCPTools() {
    const client = await this.getGoogleMapsMCPClient();
    return await client.tools();
  }

  // 关闭谷歌地图客户端方法
  public async closeGoogleMapsMCPClient() {
    if (this._googleMapsMCPClient) {
      await this._googleMapsMCPClient.close();
      this._googleMapsMCPClient = null;
      console.log('Google Maps MCP客户端已手动关闭');
    }
  }
}

// 导出单例实例
const clientManager = ClientManager.getInstance();

export const weatherClient = clientManager.weatherClient;
export const wikipediaClient = clientManager.wikipediaClient;
export const exaClient = clientManager.exaClient;
export const wikidataClient = clientManager.wikidataClient;

// MCP客户端需要异步获取，不能直接导出
export const getGoogleMapsMCPClient = () => clientManager.getGoogleMapsMCPClient();
export const getGoogleMapsMCPTools = () => clientManager.getGoogleMapsMCPTools();
export const closeGoogleMapsMCPClient = () => clientManager.closeGoogleMapsMCPClient();
