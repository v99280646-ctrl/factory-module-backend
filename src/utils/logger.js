function formatMessage(level, message, meta) {
  const timestamp = new Date().toISOString();
  const details = meta ? ` ${meta instanceof Error ? meta.stack || meta.message : JSON.stringify(meta)}` : '';

  return `[${timestamp}] ${level.toUpperCase()}: ${message}${details}`;
}

const logger = {
  info(message, meta) {
    console.info(formatMessage('info', message, meta));
  },
  warn(message, meta) {
    console.warn(formatMessage('warn', message, meta));
  },
  error(message, meta) {
    if (message instanceof Error) {
      console.error(formatMessage('error', message.message, message));
      return;
    }
    console.error(formatMessage('error', message, meta));
  },
};

export default logger;
