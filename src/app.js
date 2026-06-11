import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import routes from './routes/index.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { errorConverter, errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.use('/api', apiLimiter, routes);

app.use(notFoundHandler);
app.use(errorConverter);
app.use(errorHandler);

export default app;
