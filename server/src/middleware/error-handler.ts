import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

interface OperationalError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: OperationalError,
  _request: Request,
  response: Response,
  next: NextFunction,
): void => {
  void next;

  // Handle Multer errors (file upload validation)
  if (error instanceof multer.MulterError) {
    console.error(JSON.stringify({
      message: error.message,
      code: error.code,
      field: error.field,
      statusCode: 400,
    }));
    response.status(400).json({
      message: error.message,
    });
    return;
  }

  // Handle custom file filter errors from multer (not MulterError instances)
  if (error.message === 'Only PDF and DOCX files are allowed' || error.message === 'Invalid filename') {
    console.error(JSON.stringify({
      message: error.message,
      statusCode: 400,
    }));
    response.status(400).json({
      message: error.message,
    });
    return;
  }

  const statusCode = error.statusCode ?? 500;

  // Log full error server-side
  console.error(JSON.stringify({
    message: error.message,
    stack: error.stack,
    statusCode,
  }));

  // Only expose message for operational errors
  response.status(statusCode).json({
    message: error.isOperational ? error.message : 'Internal server error',
  });
};
