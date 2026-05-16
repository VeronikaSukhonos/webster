import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import path from 'path';
import { JsonDocument } from '../../common/utils';
import mime from 'mime';

@Injectable()
export class CloudflareR2Service {
  private s3Client: S3Client;
  private MAX_DOCUMENT_BYTES: number = 1000000;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: this.configService.get('CLOUDFLARE_R2_ENDPOINT') ?? 'cloudflare-r2-endpoint',
      credentials: {
        accessKeyId:
          this.configService.get('CLOURFLARE_R2_ACCESS_KEY_ID') ?? 'cloudflare-r2-access-key-id',
        secretAccessKey:
          this.configService.get('CLOURFLARE_R2_SECRET_ACCESS_KEY') ??
          'cloudflare-r2-secret-access-key',
      },
    });
  }

  async uploadImageFile(
    file: Express.Multer.File,
    filetype: 'avatars' | 'projects' | 'images',
    filename: string,
    extension?: string,
  ): Promise<string> {
    const fileExtension = extension ?? path.extname(file.originalname).toLowerCase();
    const filepath = ['files', ...filetype.split('/'), `${filename}${fileExtension}`].join('/');

    const command = new PutObjectCommand({
      Bucket: this.configService.get('CLOUDFLARE_R2_BUCKET_NAME'),
      Key: filepath,
      Body: file.buffer,
      ContentType: mime.getType(fileExtension) ?? 'image/jpeg',
    });
    await this.s3Client.send(command);

    const apiUrl =
      this.configService.get<string>('CLOUDFLARE_R2_BUCKET_URL') ??
      this.configService
        .get<string>('VITE_API_URL')
        ?.replace(/\/api$/, '')
        .replace(/\/$/, '');

    return apiUrl ? `${apiUrl}/${filepath}` : `/${filepath}`;
  }

  async readJsonDocument(filename: string): Promise<JsonDocument> {
    const filepath = this.resolveJsonFilePath(filename);
    const command = new GetObjectCommand({
      Bucket: this.configService.get('CLOUDFLARE_R2_BUCKET_NAME'),
      Key: filepath,
    });

    try {
      const response = await this.s3Client.send(command);
      const content = response.Body ? await response.Body.transformToString() : '';
      const parsed: unknown = JSON.parse(content);

      if (!(typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed))) {
        throw new BadRequestException('Document content must be a JSON object');
      }

      return parsed as JsonDocument;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'NotFound'
      ) {
        throw new NotFoundException('Document file is not found');
      }
      throw new InternalServerErrorException('Failed to read document file');
    }
  }

  async writeJsonDocument(filename: string, file: JsonDocument): Promise<void> {
    const filepath = this.resolveJsonFilePath(filename);
    const serialized = JSON.stringify(file);
    if (Buffer.byteLength(serialized, 'utf8') > this.MAX_DOCUMENT_BYTES) {
      throw new BadRequestException('Document content must be at most 1000000 bytes');
    }
    const command = new PutObjectCommand({
      Bucket: this.configService.get('CLOUDFLARE_R2_BUCKET_NAME'),
      Key: filepath,
      Body: serialized,
      ContentType: 'application/json',
    });

    await this.s3Client.send(command);
  }

  private resolveJsonFilePath(relativePath: string): string {
    const normalizedPath = relativePath.replace(/\\/g, '/');

    if (!normalizedPath || normalizedPath.startsWith('/') || normalizedPath.includes('..')) {
      throw new BadRequestException('Invalid document file path');
    }

    const resolvedPath = `storage/documents/${normalizedPath}`;

    return resolvedPath;
  }

  async deleteFile(fileKey: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.configService.get('CLOUDFLARE_R2_BUCKET_NAME'),
      Key: fileKey,
    });

    await this.s3Client.send(command);
  }
}
