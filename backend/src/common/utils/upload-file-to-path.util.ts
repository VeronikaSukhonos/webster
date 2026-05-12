import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export async function uploadFileToPath(
  file: Express.Multer.File,
  filetype: 'avatars' | 'projects',
  filename: string,
  extension?: string,
): Promise<string> {
  const fileExtension = extension ?? path.extname(file.originalname).toLowerCase();
  const filepath = path.join('files', ...filetype.split('/'), `${filename}${fileExtension}`);

  await mkdir(path.dirname(filepath), { recursive: true });
  await writeFile(filepath, file.buffer);

  const normalizedPath = filepath.replace(/\\/g, '/');
  const apiUrl = process.env.VITE_API_URL?.replace(/\/api$/, '').replace(/\/$/, '');

  return apiUrl ? `${apiUrl}/${normalizedPath}` : `/${normalizedPath}`;
}
