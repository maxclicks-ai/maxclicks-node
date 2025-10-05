export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

const levelPriority: Record<LogLevel, number> = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
};

export interface ILogger {
  level: LogLevel;
  setLevel(level: LogLevel): void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

export class Logger implements ILogger {
  level: LogLevel;

  constructor(level: LogLevel = 'silent') {
    this.level = level;
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private shouldLog(level: LogLevel) {
    return levelPriority[this.level] >= levelPriority[level];
  }

  error = (...args: any[]) => {
    if (this.shouldLog('error')) console.error(...args);
  };

  warn = (...args: any[]) => {
    if (this.shouldLog('warn')) console.warn(...args);
  };

  info = (...args: any[]) => {
    if (this.shouldLog('info')) console.log(...args);
  };

  debug = (...args: any[]) => {
    if (this.shouldLog('debug')) console.debug(...args);
  };
}

export function createLogger(level: LogLevel = 'silent') {
  return new Logger(level);
}
