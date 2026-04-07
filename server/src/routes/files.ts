import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const filesRouter = Router();

const uploadDirectory = path.join(process.cwd(), 'server', 'storage', 'cv');

const isSafeCvFilename = (filename: string): boolean => {
  // Matches the upload naming scheme: `${Date.now()}-${random}${ext}`
  return /^[0-9]+-[a-z0-9]{8}\.(pdf|doc|docx)$/i.test(filename);
};

filesRouter.get('/cv/:filename', requireAuth, async (request, response) => {
  const filename = request.params.filename;
  if (!filename || !isSafeCvFilename(filename)) {
    response.status(400).json({ message: 'Invalid file name' });
    return;
  }

  // Candidate can download only their own CV.
  if (request.user?.role === 'CANDIDATE') {
    const candidate = await prisma.candidate.findUnique({ where: { userId: request.user.sub } });
    if (!candidate || candidate.cvPath !== filename) {
      response.status(404).json({ message: 'File not found' });
      return;
    }
  } else {
    // HOTEL/ADMIN can download only CVs that exist in DB.
    const candidate = await prisma.candidate.findFirst({
      where: { cvPath: filename },
      select: { id: true },
    });
    if (!candidate) {
      response.status(404).json({ message: 'File not found' });
      return;
    }
  }

  const fullPath = path.join(uploadDirectory, filename);
  if (!fs.existsSync(fullPath)) {
    response.status(404).json({ message: 'File not found' });
    return;
  }

  response.sendFile(fullPath);
});

