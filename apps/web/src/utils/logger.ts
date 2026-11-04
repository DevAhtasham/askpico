type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDev = import.meta.env.DEV;

const stringify = (value: unknown): string => {
  if (value instanceof Error) return value.stack ?? value.message;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

const relayToTerminal = (level: LogLevel, args: unknown[]) => {
  fetch('/__client-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ level, message: args.map(stringify).join(' ') }),
    keepalive: true,
  }).catch(() => undefined);
};

const createLevel = (level: LogLevel) => (...args: unknown[]) => {
  if (isDev) relayToTerminal(level, args);
};

export const logger = {
  debug: createLevel('debug'),
  info: createLevel('info'),
  warn: createLevel('warn'),
  error: createLevel('error'),
};
