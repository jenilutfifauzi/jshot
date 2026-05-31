/* Lightweight logger that mirrors to console and (optionally) Tauri log plugin */
type Level = 'debug' | 'info' | 'warn' | 'error';

function emit(level: Level, ...args: unknown[]) {
  const ts = new Date().toISOString();
  const prefix = `[JShot ${ts}] [${level.toUpperCase()}]`;
  // eslint-disable-next-line no-console
  (console[level] ?? console.log)(prefix, ...args);
}

export const logger = {
  debug: (...a: unknown[]) => emit('debug', ...a),
  info: (...a: unknown[]) => emit('info', ...a),
  warn: (...a: unknown[]) => emit('warn', ...a),
  error: (...a: unknown[]) => emit('error', ...a),
};
