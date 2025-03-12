import { WeatherClient } from '@agentic/weather';
import { WikipediaClient } from '@agentic/wikipedia';
import { EventEmitter } from 'events';

// 增加最大监听器数量，避免警告
EventEmitter.defaultMaxListeners = 20;

// 单例模式实现
class ClientManager {
  private static instance: ClientManager;
  private _weatherClient: WeatherClient | null = null;
  private _wikipediaClient: WikipediaClient | null = null;

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
}

// 导出单例实例
const clientManager = ClientManager.getInstance();

export const weatherClient = clientManager.weatherClient;
export const wikipediaClient = clientManager.wikipediaClient;
