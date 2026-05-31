import fs from 'node:fs/promises';
import path from 'node:path';

export const cvUploadDirectory = path.join(process.cwd(), 'server', 'storage', 'cv');

export const isSafeCvFilename = (filename: string): boolean =>
  /^[0-9]+-[a-z0-9]{8}\.(pdf|doc|docx)$/i.test(filename);

export const removeCvFileIfPresent = async (filename: string | null | undefined): Promise<void> => {
  if (!filename || !isSafeCvFilename(filename)) {
    return;
  }

  const fullPath = path.join(cvUploadDirectory, filename);

  try {
    await fs.unlink(fullPath);
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
      throw error;
    }
  }
};
