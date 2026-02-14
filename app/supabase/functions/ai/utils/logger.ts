type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const AXIOM_TOKEN = Deno.env.get('AXIOM_TOKEN');
const AXIOM_DATASET = Deno.env.get('AXIOM_DATASET') || 'midl-logs';
const LOG_LEVEL = (Deno.env.get('LOG_LEVEL') || 'info') as LogLevel;

function getMinLevel(): number {
  return LEVELS[LOG_LEVEL] ?? LEVELS.info;
}

async function send(level: LogLevel, message: string, data?: object) {
  if (LEVELS[level] < getMinLevel()) return;

  // Always log to console for Supabase logs
  console[level](
    `[${level.toUpperCase()}] ${message}`,
    data ? JSON.stringify(data) : ''
  );

  // Send to Axiom
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
          source: 'edge',
        },
      ]),
    });
  } catch (err) {
    console.error('Axiom send failed:', err);
  }
}

export const log = {
  debug: (msg: string, data?: object) => send('debug', msg, data),
  info: (msg: string, data?: object) => send('info', msg, data),
  warn: (msg: string, data?: object) => send('warn', msg, data),
  error: (msg: string, data?: object) => send('error', msg, data),
};
