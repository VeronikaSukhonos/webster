import { writeFile } from 'fs/promises';
import path from 'path';

export async function uploadFileToPath(
  file: Express.Multer.File,
  filename: string,
  filetype: 'avatars',
): Promise<string> {
  const filepath = path.join(
    'files',
    ...filetype.split('/'),
    `${filename}${path.extname(file.originalname).toLowerCase()}`,
  );

  await writeFile(filepath, file.buffer);
  return `${process.env.VITE_API_URL?.replace(/\/api$/, '')}/${filepath}`;
}
