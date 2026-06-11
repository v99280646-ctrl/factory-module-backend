import { StatusCodes, getReasonPhrase } from 'http-status-codes';

import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

export function notFoundHandler(req, res, next) {
  next(new ApiError(StatusCodes.NOT_FOUND, `Route not found: ${req.originalUrl}`));
}

export function errorConverter(error, req, res, next) {
  if (error instanceof ApiError) {
    next(error);
    return;
  }

  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = error.message || getReasonPhrase(statusCode);

  next(new ApiError(statusCode, message, false, error.stack));
}

export function errorHandler(error, req, res, _next) {
  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const response = {
    success: false,
    message: error.message,
  };

  if (env.NODE_ENV !== 'production') {
    response.stack = error.stack;
  }

  if (!error.isOperational) {
    logger.error(error);
  }

  res.status(statusCode).json(response);
}
