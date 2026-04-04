import { defineConfig } from '@playwright/test';

process.env.NODE_ENV = 'test';
process.env.PORT = '4012';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.DATABASE_URL = 'file:./prisma/test.db';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_which_is_long_enough_123456';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_which_is_long_enough_654321';
process.env.ACCESS_TOKEN_TTL = '15m';
process.env.REFRESH_TOKEN_TTL_DAYS = '7';
process.env.COOKIE_SECURE = 'false';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    browserName: 'firefox',
  },
});
