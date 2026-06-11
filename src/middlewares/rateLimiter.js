import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  },
});
