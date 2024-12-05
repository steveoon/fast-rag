import pino from 'pino';

let loggerInstance: pino.Logger | null = null;

export function getLogger(): pino.Logger {
  if (!loggerInstance) {
    const options: pino.LoggerOptions = {
      level: 'debug',
      base: {
        env: process.env.NODE_ENV,
      },
    };

    if (process.env.NODE_ENV === 'development') {
      options.transport = {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      };
    }

    loggerInstance = pino(options);
  }
  return loggerInstance;
}
