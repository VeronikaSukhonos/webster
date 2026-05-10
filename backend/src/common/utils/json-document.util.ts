import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import * as crypto from 'crypto';

export type JsonDocument = Record<string, unknown>;
export type JsonDocumentFolder = 'projects' | 'templates';

const DOCUMENT_STORAGE_ROOT = path.resolve(process.cwd(), 'storage', 'documents');
const MAX_DOCUMENT_BYTES = 1000000;

export function createJsonDocumentPath(folder: JsonDocumentFolder): string {
  return `${folder}/${crypto.randomBytes(12).toString('hex')}.json`;
}

export function isJsonDocumentPath(relativePath: string, folder: JsonDocumentFolder): boolean {
  try {
    resolveJsonDocumentPath(relativePath, folder);
    return relativePath.endsWith('.json');
  } catch {
    return false;
  }
}

export async function readJsonDocument(relativePath: string): Promise<JsonDocument> {
  const filepath = resolveJsonDocumentPath(relativePath);

  try {
    const content = await readFile(filepath, 'utf8');
    const parsed: unknown = JSON.parse(content);

    if (!isPlainJsonObject(parsed)) {
      throw new BadRequestException('Document content must be a JSON object');
    }

    return parsed;
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new NotFoundException('Document file is not found');
    }
    throw new InternalServerErrorException('Failed to read document file');
  }
}

export async function writeJsonDocument(
  relativePath: string,
  content: JsonDocument,
): Promise<void> {
  const filepath = resolveJsonDocumentPath(relativePath);
  const serialized = JSON.stringify(content);

  if (Buffer.byteLength(serialized, 'utf8') > MAX_DOCUMENT_BYTES) {
    throw new BadRequestException('Document content must be at most 1000000 bytes');
  }

  await mkdir(path.dirname(filepath), { recursive: true });
  await writeFile(filepath, serialized, 'utf8');
}

function resolveJsonDocumentPath(relativePath: string, folder?: JsonDocumentFolder): string {
  const normalizedPath = relativePath.replace(/\\/g, '/');

  if (
    !normalizedPath ||
    path.isAbsolute(normalizedPath) ||
    normalizedPath.includes('..') ||
    (folder && !normalizedPath.startsWith(`${folder}/`))
  ) {
    throw new BadRequestException('Invalid document file path');
  }

  const resolvedPath = path.resolve(DOCUMENT_STORAGE_ROOT, normalizedPath);

  if (!resolvedPath.startsWith(`${DOCUMENT_STORAGE_ROOT}${path.sep}`)) {
    throw new BadRequestException('Invalid document file path');
  }

  return resolvedPath;
}

function isPlainJsonObject(value: unknown): value is JsonDocument {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}
