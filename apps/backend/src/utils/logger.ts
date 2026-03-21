export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogContext = Record<string, unknown>

function write(level: LogLevel, message: string, context: LogContext): void {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...context
  }

  const line = JSON.stringify(payload)
  if (level === 'error' || level === 'warn') {
    console.error(line)
    return
  }
  console.log(line)
}

export const logger = {
  debug(message: string, context: LogContext = {}): void {
    write('debug', message, context)
  },
  info(message: string, context: LogContext = {}): void {
    write('info', message, context)
  },
  warn(message: string, context: LogContext = {}): void {
    write('warn', message, context)
  },
  error(message: string, context: LogContext = {}): void {
    write('error', message, context)
  }
}
