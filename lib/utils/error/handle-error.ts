import { NoSuchToolError, InvalidArgumentError, ToolCallRepairError } from 'ai';
import { logger } from '../logger';
import { type ErrorResponse, CustomError } from '@/types';
import { ZodError } from 'zod';

// 为AI SDK错误添加格式化函数
export function formatAiSdkError(error: unknown): {
  message: string;
  errorType: string;
  code: string;
} {
  if (NoSuchToolError.isInstance(error)) {
    return {
      message: '助手尝试调用不存在的工具',
      errorType: 'NoSuchToolError',
      code: 'TOOL_NOT_FOUND',
    };
  } else if (InvalidArgumentError.isInstance(error)) {
    return {
      message: '助手使用了无效的工具参数',
      errorType: 'InvalidArgumentError',
      code: 'INVALID_TOOL_ARGS',
    };
  } else if (ToolCallRepairError.isInstance(error)) {
    return {
      message: '修复工具调用时发生错误',
      errorType: 'ToolCallRepairError',
      code: 'TOOL_REPAIR_ERROR',
    };
  }

  // 默认错误信息 (ToolExecutionError removed in AI SDK v6)
  return {
    message: '工具调用过程中发生未知错误',
    errorType: 'UnknownToolError',
    code: 'UNKNOWN_TOOL_ERROR',
  };
}

export function handleError(error: unknown): ErrorResponse {
  // 先检查AI SDK特定错误
  if (
    NoSuchToolError.isInstance(error) ||
    InvalidArgumentError.isInstance(error) ||
    ToolCallRepairError.isInstance(error)
  ) {
    const { message, errorType, code } = formatAiSdkError(error);

    logger.error({
      msg: `AI SDK Tool Error: ${errorType}`,
      error: {
        message,
        code,
      },
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      message,
      code,
    };
  }

  if (error instanceof CustomError) {
    logger.error({
      msg: 'Custom Error',
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
      },
      stack: error.stack,
    });

    return {
      message: error.message,
      code: error.code,
    };
  }

  if (error instanceof ZodError) {
    logger.error({
      msg: 'Validation Error',
      error: error.errors,
    });

    return {
      message: '参数验证失败',
      code: 'VALIDATION_ERROR',
      details: error.errors.map(error => error.message).join(', '),
    };
  }

  if (error instanceof Error) {
    logger.error({
      msg: 'Unexpected Error',
      error: {
        message: error.message,
        name: error.name,
      },
      stack: error.stack,
    });

    return {
      message: '操作失败，请稍后重试',
      code: 'UNEXPECTED_ERROR',
    };
  }

  logger.error({
    msg: 'Unknown Error',
    error,
  });

  return {
    message: '发生未知错误，请联系支持团队',
    code: 'UNKNOWN_ERROR',
  };
}
