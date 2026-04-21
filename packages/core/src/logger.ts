import { format } from 'node:util';

/** Supported log severity levels, ordered from highest to lowest severity. */
export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;

/** Log severity used by the core logger. */
export type LogLevel = (typeof LOG_LEVELS)[number];

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

function normalizeLogLevel(value: string | undefined): LogLevel {
  if (value) {
    const normalized = value.toLowerCase();
    if ((LOG_LEVELS as readonly string[]).includes(normalized)) {
      return normalized as LogLevel;
    }
  }
  return 'info';
}

/** Structured log payload emitted to transports. */
export type LogRecord = {
  /** Severity of the log record. */
  level: LogLevel;
  /** Rendered message after argument formatting. */
  message: string;
  /** Time when the record was emitted. */
  timestamp: Date;
};

/**
 * Transport used by the logger.
 *
 * Implementations can provide optional group/section methods if supported by
 * the host runtime. Unsupported hooks can be omitted (no-op behavior).
 */
export type LogTransport = {
  log: (record: LogRecord) => void;
  startGroup?: (name: string) => void;
  endGroup?: () => void;
  section?: (name: string) => void;
};

/**
 * Logger implementation that emits structured records to one or more transports.
 *
 * Use {@link Logger.append} to add transport sinks or {@link Logger.replace} to
 * replace all sinks at once.
 */
export class Logger {
  private currentLevel: LogLevel = normalizeLogLevel(process.env.LOG_LEVEL);
  private transports: LogTransport[] = [defaultTransport];

  /** Minimum log level to emit. */
  public get level(): LogLevel {
    return this.currentLevel;
  }

  public set level(value: LogLevel) {
    this.currentLevel = value;
  }

  /** Add a transport while keeping existing transports active. */
  public append(transport: LogTransport): void {
    this.transports.push(transport);
  }

  /** Replace all active transports with one or more new transports. */
  public replace(transport: LogTransport | LogTransport[]): void {
    // Swap all sinks in one step.
    this.transports = Array.isArray(transport) ? [...transport] : [transport];
  }

  /** Restore the default console transport. */
  public reset(): void {
    this.transports = [defaultTransport];
  }

  /** Start a named group in logger implementations that support grouping. */
  public startGroup(name: string): void {
    this.forEachTransport((transport) => transport.startGroup?.(name));
  }

  /** End the current group in logger implementations that support grouping. */
  public endGroup(): void {
    this.forEachTransport((transport) => transport.endGroup?.());
  }

  /** Emit a standalone section marker in logger implementations that support sections. */
  public section(name: string): void {
    this.forEachTransport((transport) => transport.section?.(name));
  }

  /** Log at fatal level. */
  public fatal(...args: unknown[]): void {
    this.emit('fatal', args);
  }

  /** Log at error level. */
  public error(...args: unknown[]): void {
    this.emit('error', args);
  }

  /** Log at warn level. */
  public warn(...args: unknown[]): void {
    this.emit('warn', args);
  }

  /** Log at info level. */
  public info(...args: unknown[]): void {
    this.emit('info', args);
  }

  /** Log at debug level. */
  public debug(...args: unknown[]): void {
    this.emit('debug', args);
  }

  /** Log at trace level. */
  public trace(...args: unknown[]): void {
    this.emit('trace', args);
  }

  private emit(level: LogLevel, args: unknown[]): void {
    if (!this.shouldLog(level)) return;

    const message = args.length > 0 ? format(...args) : '';
    const record: LogRecord = {
      level,
      message,
      timestamp: new Date(),
    };

    for (const transport of this.transports) {
      try {
        transport.log(record);
      } catch (error) {
        // A broken transport should never stop other transports from receiving logs.
        console.error('Logger transport failure:', error);
      }
    }
  }

  private forEachTransport(action: (transport: LogTransport) => void): void {
    for (const transport of this.transports) {
      try {
        action(transport);
      } catch (error) {
        // A broken transport should never stop other transports from receiving logs.
        console.error('Logger structure hook failure:', error);
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_RANK[level] <= LOG_LEVEL_RANK[this.currentLevel];
  }
}

// Fallback transport so logger is always usable before custom wiring is configured.
const defaultTransport: LogTransport = {
  log({ level, message }) {
    switch (level) {
      case 'fatal':
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'debug':
      case 'trace':
        console.debug(message);
        break;
      case 'info':
      default:
        console.info(message);
        break;
    }
  },
};

/** Default logger instance */
export const logger = new Logger();
