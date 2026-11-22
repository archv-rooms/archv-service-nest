import { BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';

const ALLOWED_MIME_TYPES = [
  // imagens
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',

  // vídeos
  'video/mp4',
  'video/webm',

  // arquivos de rom/room
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/vnd.rar',
  'application/x-7z-compressed',
  'application/octet-stream',
];

const MAX_SIZE_MB = 100;

// Mesmas regras do multer.js original: guarda o arquivo em memória (não em
// disco) e limita tipo/tamanho antes de deixar o arquivo passar pro
// controller. Importado por qualquer módulo que usar FileInterceptor.
export const multerOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: MAX_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req: unknown, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new BadRequestException(`Tipo de arquivo não permitido: ${file.mimetype}`), false);
    }
  },
};
