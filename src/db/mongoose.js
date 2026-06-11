import mongoose from 'mongoose';

import { env } from '../config/env.js';
import logger from '../utils/logger.js';

mongoose.set('strictQuery', true);

export async function connectDatabase() {
  mongoose.connection.on('connected', () => logger.info('MongoDB connected'));
  mongoose.connection.on('error', (error) => logger.error('MongoDB connection error', error));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: env.NODE_ENV !== 'production',
  });
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
