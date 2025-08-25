export type LogLevel = 'error' | 'info' | 'debug';

let currentLevel: LogLevel = 'info';

export function setLogLevel(level: LogLevel) {
  currentLevel = level;
}

function shouldLog(level: 'debug' | 'info' | 'error'): boolean {
  switch (currentLevel) {
    case 'debug':
      return true;
    case 'info':
      return level !== 'debug';
    case 'error':
      return level === 'error';
    default:
      return true;
  }
}

export const logger = {
  debug: (...args: any[]) => {
    if (shouldLog('debug')) {
      console.log('[DEBUG]', ...args);
    }
  },
  info: (...args: any[]) => {
    if (shouldLog('info')) {
      console.log('[INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (shouldLog('info')) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args: any[]) => {
    // Always allow errors at any level above or equal to 'error'
    console.error('[ERROR]', ...args);
  },
};