import { WeatherClient } from '@agentic/weather';
import { WikipediaClient } from '@agentic/wikipedia';
import { WikidataClient } from '@agentic/wikidata';
import { ExaClient } from '@agentic/exa';
import { EventEmitter } from 'events';

// 增加最大监听器数量，避免警告
EventEmitter.defaultMaxListeners = 20;

// 单例模式实现
class ClientManager {
  private static instance: ClientManager;
  private _weatherClient: WeatherClient | null = null;
  private _wikipediaClient: WikipediaClient | null = null;
  private _exaClient: ExaClient | null = null;
  private _wikidataClient: WikidataClient | null = null;
  private constructor() {
    // 私有构造函数，防止外部直接实例化
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
}

// 导出单例实例
const clientManager = ClientManager.getInstance();

export const weatherClient = clientManager.weatherClient;
export const wikipediaClient = clientManager.wikipediaClient;
export const exaClient = clientManager.exaClient;
export const wikidataClient = clientManager.wikidataClient;
