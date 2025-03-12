/**
 * 通用的重试函数，使用指数退避策略
 * 当遇到429错误（太多请求）或其他指定错误时自动重试
 *
 * @param fn 需要执行的异步函数
 * @param options 重试选项
 * @returns 异步函数的结果
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    shouldRetry?: (error: Error) => boolean;
    onRetry?: (error: Error, retryCount: number, delay: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 2000,
    shouldRetry = (error: Error) => error.message.includes('429'),
    onRetry = (error: Error, retryCount: number, delay: number) => {
      console.log(
        `Error: ${error.message}. Retrying (${retryCount}/${maxRetries}) in ${delay}ms...`
      );
    },
  } = options;

  let retries = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const typedError = error as Error;

      if (retries < maxRetries - 1 && shouldRetry(typedError)) {
        retries++;
        const delay = initialDelay * Math.pow(2, retries - 1);
        onRetry(typedError, retries, delay);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }

  throw new Error('Maximum retry attempts exceeded');
}

/**
 * 特定用于HTTP 429 (Too Many Requests) 错误的重试函数
 *
 * @param fn 需要执行的异步函数
 * @param maxRetries 最大重试次数
 * @param initialDelay 初始延迟（毫秒）
 * @returns 异步函数的结果
 */
export async function retryRateLimited<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 2000
): Promise<T> {
  return retryWithBackoff(fn, {
    maxRetries,
    initialDelay,
    shouldRetry: (error: Error) => error.message.includes('429'),
    onRetry: (error, retryCount, delay) => {
      console.log(`Rate limited, retrying (${retryCount}/${maxRetries}) in ${delay}ms...`);
    },
  });
}
