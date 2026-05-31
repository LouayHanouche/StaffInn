import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  cvUploadDirectory,
  isSafeCvFilename,
  removeCvFileIfPresent,
} from '../../server/src/utils/cv-files.js';

describe('cv file helpers', () => {
  const safeFilename = '1778451934691-69f1c0sb.pdf';
  const testFilePath = path.join(cvUploadDirectory, safeFilename);

  beforeEach(async () => {
    await fs.mkdir(cvUploadDirectory, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testFilePath, { force: true });
  });

  it('accepts upload-generated CV filenames only', () => {
    expect(isSafeCvFilename('1778451934691-69f1c0sb.pdf')).toBe(true);
    expect(isSafeCvFilename('../resume.pdf')).toBe(false);
    expect(isSafeCvFilename('resume.pdf')).toBe(false);
  });

  it('removes a safe stored CV file when present', async () => {
    await fs.writeFile(testFilePath, 'cv-content');

    await removeCvFileIfPresent(safeFilename);

    await expect(fs.access(testFilePath)).rejects.toBeTruthy();
  });

  it('ignores missing or unsafe filenames', async () => {
    await removeCvFileIfPresent(undefined);
    await removeCvFileIfPresent('../resume.pdf');

    await expect(fs.access(testFilePath)).rejects.toBeTruthy();
  });
});
