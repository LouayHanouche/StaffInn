import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject } from 'zod';

export const validateBody = (schema: AnyZodObject) =>
  (request: Request, response: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      response.status(400).json({
        message: 'Invalid request body',
        errors: parsed.error.flatten(),
      });
      return;
    }
    request.body = parsed.data;
    next();
  };
