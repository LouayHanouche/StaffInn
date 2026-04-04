import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { test, expect } from '@playwright/test';

const clientPort = 4173;
const clientUrl = `http://127.0.0.1:${clientPort}`;
const projectRoot = path.resolve(process.cwd(), '..');

let clientProcess: ChildProcess | undefined;

const isClientReady = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${clientUrl}/login`);
    return response.ok;
  } catch {
    return false;
  }
};

const waitForClient = async (): Promise<void> => {
  const maxAttempts = 120;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const ready = await isClientReady();
    if (ready) {
      return;
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 500);
    });
  }

  throw new Error('Client dev server did not start in time for theme e2e tests.');
};

test.beforeAll(async () => {
  clientProcess = spawn(
    'npm',
    ['run', 'dev', '--workspace', 'client', '--', '--host', '127.0.0.1', '--port', `${clientPort}`],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        VITE_API_BASE_URL: 'http://localhost:4000',
      },
      stdio: 'pipe',
    },
  );

  await waitForClient();
});

test.afterAll(async () => {
  if (!clientProcess) {
    return;
  }

  const processToStop = clientProcess;
  processToStop.kill('SIGTERM');

  await new Promise<void>((resolve) => {
    const forceTimer = setTimeout(() => {
      if (!processToStop.killed) {
        processToStop.kill('SIGKILL');
      }
      resolve();
    }, 3_000);

    processToStop.once('exit', () => {
      clearTimeout(forceTimer);
      resolve();
    });
  });
});

test.beforeEach(async ({ page }) => {
  await page.route('http://localhost:4000/**', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Unauthorized' }),
    });
  });
});

test('login stays in dark mode even when light mode was previously stored', async ({ page }) => {
  await page.goto(`${clientUrl}/login`);
  await page.evaluate(() => {
    localStorage.setItem('staffinn-theme', 'light');
  });
  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByTestId('auth-theme-toggle')).toHaveCount(0);
});

test('register page keeps branded gradient and no longer exposes a theme toggle', async ({ page }) => {
  await page.goto(`${clientUrl}/register`);
  await page.evaluate(() => {
    localStorage.setItem('staffinn-theme', 'light');
  });
  await page.reload();

  const sidebarGradient = await page.locator('.login-sidebar').evaluate((element) => {
    return window.getComputedStyle(element).backgroundImage;
  });
  expect(sidebarGradient).toContain('linear-gradient');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByTestId('auth-theme-toggle')).toHaveCount(0);
});
