import { StatusCodes } from 'http-status-codes';

import ApiError from '../utils/ApiError.js';

export default function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');

      next(new ApiError(StatusCodes.BAD_REQUEST, message));
      return;
    }

    req.body = result.data.body || req.body;
    req.params = result.data.params || req.params;
    if (result.data.query) {
      Object.assign(req.query, result.data.query);
    }

    next();
  };
}
