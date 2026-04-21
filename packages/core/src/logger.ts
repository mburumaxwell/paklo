import pino from 'pino';
import pretty from 'pino-pretty';

const prettyStream = pretty({ ignore: 'pid,hostname' });
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'debug');

/** Default logger instance */
export const logger = pino({ level }, process.env.NODE_ENV === 'production' ? undefined : prettyStream);
