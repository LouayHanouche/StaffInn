import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

const uploadDirectory = path.join(process.cwd(), 'server', 'storage', 'cv');

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const hasPathTraversalTokens = (filename: string): boolean =>
  filename.includes('..') || filename.includes('/') || filename.includes('\\');

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
    callback(null, fileName);
  },
});

export const cvUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    if (hasPathTraversalTokens(file.originalname)) {
      callback(new Error('Invalid filename'));
      return;
    }
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = new Set(['.pdf', '.doc', '.docx']);
    if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
      callback(new Error('Only PDF and DOCX files are allowed'));
      return;
    }
    callback(null, true);
  },
});
