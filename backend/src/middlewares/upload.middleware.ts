// src/middlewares/upload.middleware.ts
// Middleware de upload de imagens com Multer (memória → Azure Blob)

import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10);

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens JPG, PNG ou WebP são permitidas.'));
  }
};

export const upload = multer({
  storage: multer.memoryStorage(), // Mantém o arquivo em memória para envio ao Azure Blob
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024,
  },
  fileFilter,
});
