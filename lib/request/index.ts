import { toast } from '@/hooks/use-toast';
import { getUserActiveKey } from '@/lib/actions/get-user-active-key';

interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  status: number;
}

type RequestConfig = RequestInit & {
  params?: Record<string, string>;
};

class Request {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(url: string, config: RequestConfig): Promise<ApiResponse<T>> {
    const token = await getUserActiveKey();
    const fullUrl = new URL(this.baseURL + url, window.location.origin);

    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        fullUrl.searchParams.append(key, value);
      });
    }

    const headers = new Headers(config.headers);
    headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(fullUrl.toString(), {
      ...config,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error || 'An unexpected error occurred';
      toast({
        title: errorMsg,
        description: response.status,
        variant: 'destructive',
      });
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return this.formatResponse(data, response.statusText, response.status);
  }

  private formatResponse<T>(data: T, message: string, status: number): ApiResponse<T> {
    return { data, message, status };
  }

  public get = <T = unknown>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> =>
    this.request<T>(url, { ...config, method: 'GET' });

  public post = <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> =>
    this.request<T>(url, { ...config, method: 'POST', body: JSON.stringify(data) });

  public put = <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> =>
    this.request<T>(url, { ...config, method: 'PUT', body: JSON.stringify(data) });

  public patch = <T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> =>
    this.request<T>(url, { ...config, method: 'PATCH', body: JSON.stringify(data) });

  public del = <T = unknown>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> =>
    this.request<T>(url, { ...config, method: 'DELETE' });

  public sse = async (args: {
    url: string;
    data: BodyInit;
    config?: RequestInit;
    onData: (data: { completed?: boolean; percent?: string; [key: string]: unknown }) => void;
  }) => {
    const { url, data, config, onData } = args;
    const token = await getUserActiveKey();

    const response = await fetch(`/api/v1${url}`, {
      method: 'POST',
      body: data,
      ...config,
      headers: {
        Accept: 'text/event-stream',
        Authorization: `Bearer ${token}`,
        ...config?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let isDone = false;
    while (!isDone) {
      const { done, value } = await reader.read();
      isDone = done;
      if (isDone) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const eventData = line.slice(6);
          try {
            const parsedData = JSON.parse(eventData);
            onData(parsedData);
          } catch (error) {
            console.error('parse event data error:', error);
          }
        }
      }
    }

    console.log('stream done');
  };
}

const api = new Request('/api/v1');
export default api;
