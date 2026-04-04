import type { NextFunction, Request, Response } from 'express';

export const errorHandler = (
  error: Error,
  _request: Request,
  response: Response,
  next: NextFunction,
): void => {
  void next;
  response.status(400).json({
    message: error.message || 'Request failed',
  });
};
