import { logger } from '../logger';
import { type ErrorResponse, CustomError } from '@/types';
import { ZodError } from 'zod';

export function handleError(error: unknown): ErrorResponse {
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
      details: error.errors.map((error) => error.message).join(', '),
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
