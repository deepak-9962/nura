function write(level, message, context) {
    const payload = {
        ts: new Date().toISOString(),
        level,
        message,
        ...context
    };
    const line = JSON.stringify(payload);
    if (level === 'error' || level === 'warn') {
        console.error(line);
        return;
    }
    console.log(line);
}
export const logger = {
    debug(message, context = {}) {
        write('debug', message, context);
    },
    info(message, context = {}) {
        write('info', message, context);
    },
    warn(message, context = {}) {
        write('warn', message, context);
    },
    error(message, context = {}) {
        write('error', message, context);
    }
};
