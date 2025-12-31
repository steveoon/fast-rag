import { NoObjectGeneratedError } from 'ai';
import { z } from 'zod';

/**
 * NoObjectGeneratedError 的详细信息
 */
export interface ObjectGenerationErrorInfo {
  /** 模型返回的原始文本 */
  text: string | undefined;
  /** 错误原因 */
  cause: unknown;
  /** Token 使用情况 */
  usage: unknown;
  /** 响应元数据 */
  response: unknown;
}

/**
 * 处理 NoObjectGeneratedError 的结果
 */
export interface HandleObjectErrorResult<T> {
  /** 是否是 NoObjectGeneratedError */
  isObjectError: boolean;
  /** 错误详情（仅当 isObjectError 为 true 时存在） */
  errorInfo?: ObjectGenerationErrorInfo;
  /** 从 error.text 解析出的数据（如果解析成功） */
  parsedOutput?: T;
}

/**
 * 从 markdown 代码块中提取 JSON
 */
function extractJsonFromText(text: string): string {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  return text.trim();
}

/**
 * 处理 generateText 结构化输出错误
 *
 * @param error - 捕获的错误
 * @param options - 可选配置
 * @param options.schema - Zod schema，用于尝试从 error.text 解析数据
 * @param options.logPrefix - 日志前缀，用于标识错误来源
 * @param options.silent - 是否静默模式（不输出日志）
 *
 * @example
 * ```typescript
 * try {
 *   const { output } = await generateText({
 *     model: getLanguageModel(modelId),
 *     output: Output.object({ schema: mySchema }),
 *     prompt: '...',
 *   });
 *   return output;
 * } catch (error) {
 *   const result = handleObjectGenerationError(error, {
 *     schema: mySchema,
 *     logPrefix: 'MyFunction',
 *   });
 *
 *   if (result.parsedOutput) {
 *     return result.parsedOutput;
 *   }
 *
 *   // 使用默认值或重新抛出错误
 *   return defaultValue;
 * }
 * ```
 */
export function handleObjectGenerationError<T = unknown>(
  error: unknown,
  options?: {
    schema?: z.ZodType<T>;
    logPrefix?: string;
    silent?: boolean;
  }
): HandleObjectErrorResult<T> {
  const { schema, logPrefix = 'generateText', silent = false } = options ?? {};

  if (!NoObjectGeneratedError.isInstance(error)) {
    if (!silent) {
      console.error(`[${logPrefix}] 非结构化输出错误:`, error);
    }
    return { isObjectError: false };
  }

  const errorInfo: ObjectGenerationErrorInfo = {
    text: error.text,
    cause: error.cause,
    usage: error.usage,
    response: error.response,
  };

  if (!silent) {
    console.warn(`[${logPrefix}] 结构化输出生成失败`);
    console.warn(`[${logPrefix}] Cause:`, error.cause);
    console.warn(`[${logPrefix}] Text:`, error.text);
    console.warn(`[${logPrefix}] Usage:`, error.usage);
  }

  // 尝试从 error.text 解析 JSON
  if (schema && error.text) {
    try {
      const jsonStr = extractJsonFromText(error.text);
      const parsed = JSON.parse(jsonStr);
      const validated = schema.parse(parsed);

      if (!silent) {
        console.info(`[${logPrefix}] 从原始文本成功解析出有效数据`);
      }

      return {
        isObjectError: true,
        errorInfo,
        parsedOutput: validated,
      };
    } catch (parseError) {
      if (!silent) {
        console.warn(`[${logPrefix}] 无法从原始文本解析数据:`, parseError);
      }
    }
  }

  return {
    isObjectError: true,
    errorInfo,
  };
}

/**
 * 简化版：检查是否是 NoObjectGeneratedError 并记录日志
 *
 * @param error - 捕获的错误
 * @param logPrefix - 日志前缀
 * @returns 是否是 NoObjectGeneratedError
 */
export function isObjectGenerationError(error: unknown, logPrefix?: string): boolean {
  const result = handleObjectGenerationError(error, { logPrefix, silent: false });
  return result.isObjectError;
}
