import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { adminRouter } from './routes/admin.js';
import { authRouter } from './routes/auth.js';
import { candidateRouter } from './routes/candidate.js';
import { healthRouter } from './routes/health.js';
import { hotelRouter } from './routes/hotel.js';
import { filesRouter } from './routes/files.js';
import { offersRouter } from './routes/offers.js';

export const createApp = () => {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  // Serve uploaded files through a protected endpoint implemented in routes.
  // (No public express.static for uploads)

  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/files', filesRouter);
  app.use('/offers', offersRouter);
  app.use('/', hotelRouter);
  app.use('/', candidateRouter);
  app.use('/candidates', candidateRouter);
  app.use('/admin', adminRouter);

  app.use(errorHandler);

  return app;
};
