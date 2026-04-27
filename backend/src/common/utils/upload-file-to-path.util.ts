import { writeFile } from 'fs/promises';
import path from 'path';
import * as crypto from 'crypto';

export async function uploadFileToPath(
  file: Express.Multer.File,
  filetype: 'avatars',
): Promise<string> {
  const filename = crypto.randomBytes(10).toString('hex');
  const filepath = path.join(
    'files',
    ...filetype.split('/'),
    `${filename}${Date.now()}${path.extname(file.originalname).toLowerCase()}`,
  );

  await writeFile(filepath, file.buffer);
  return `${process.env.VITE_API_URL?.replace(/\/api$/, '')}/${filepath}`;
}
