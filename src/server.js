import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './db/mongoose.js';
import logger from './utils/logger.js';

let server;

async function startServer() {
  try {
    await connectDatabase();

    server = app.listen(env.PORT, () => {
      logger.info(`API listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully.`);

  if (server) {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    return;
  }

  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason);
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  shutdown('uncaughtException');
});

startServer();
