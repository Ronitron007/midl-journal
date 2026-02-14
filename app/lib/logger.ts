type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const AXIOM_TOKEN = process.env.EXPO_PUBLIC_AXIOM_TOKEN;
const AXIOM_DATASET = process.env.EXPO_PUBLIC_AXIOM_DATASET || 'midl-logs';
const ENV_LOG_LEVEL = process.env.EXPO_PUBLIC_LOG_LEVEL as LogLevel | undefined;

declare const __DEV__: boolean;

function getMinLevel(): number {
  if (ENV_LOG_LEVEL && LEVELS[ENV_LOG_LEVEL] !== undefined) {
    return LEVELS[ENV_LOG_LEVEL];
  }
  return __DEV__ ? LEVELS.debug : LEVELS.warn;
}

async function send(level: LogLevel, message: string, data?: object) {
  if (LEVELS[level] < getMinLevel()) return;

  // Console log in dev for immediate feedback
  if (__DEV__) {
    console[level](`[${level.toUpperCase()}] ${message}`, data || '');
  }

  // Send to Axiom (silent fail - logging shouldn't break app)
  if (!AXIOM_TOKEN) return;

  try {
    await fetch(`https://api.axiom.co/v1/datasets/${AXIOM_DATASET}/ingest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AXIOM_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          _time: new Date().toISOString(),
          level,
          message,
          ...data,
          source: 'client',
        },
      ]),
    });
  } catch {
    // Silent fail
  }
}

export const log = {
  debug: (msg: string, data?: object) => send('debug', msg, data),
  info: (msg: string, data?: object) => send('info', msg, data),
  warn: (msg: string, data?: object) => send('warn', msg, data),
  error: (msg: string, data?: object) => send('error', msg, data),
};
