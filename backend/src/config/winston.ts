import winston from 'winston'
import config from './index'

// creates a new Winston Logger
export const logger = winston.createLogger({
  transports: [
    // ...(config.logfile && [
    //   new winston.transports.File({
    //     level: 'info',
    //     filename: config.logfile as string,
    //     handleExceptions: true,
    //     maxsize: 5242880, //5MB
    //     maxFiles: 5,
    //   }),
    // ]),
    new winston.transports.Console({
      level: config.logLevel as string,
      handleExceptions: true,
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
  exitOnError: false,
})

export class stream {
  write(message: string): void {
    logger.info(message)
  }
}
