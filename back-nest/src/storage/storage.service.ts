import { Injectable } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { basename, join, resolve } from 'path';

@Injectable()
export class LocalFileStorageService {
  private readonly uploadDir = resolve(process.cwd(), 'uploads', 'offices');

  async uploadImage(
    file: Express.Multer.File | undefined,
    objectKey?: string | null,
  ): Promise<string> {
    if (!file || file.size === 0) {
      throw new Error('File is empty');
    }

    await mkdir(this.uploadDir, { recursive: true });

    const originalName = basename(file.originalname || 'image');
    const fileName = objectKey
      ? `${objectKey}${this.ext(originalName, file.mimetype)}`
      : `${process.hrtime.bigint()}-${originalName}`;
    const targetPath = join(this.uploadDir, fileName);

    await writeFile(targetPath, file.buffer);

    return `/uploads/offices/${fileName}`;
  }

  async deleteImage(objectKey?: string | null): Promise<void> {
    if (!objectKey || objectKey.trim() === '') return;

    const pathPart = objectKey.startsWith('http')
      ? new URL(objectKey).pathname
      : objectKey;
    const normalized = pathPart.replace(/^\/+/, '');
    const targetPath = resolve(process.cwd(), normalized);
    const uploadsRoot = resolve(process.cwd(), 'uploads');

    if (!targetPath.startsWith(uploadsRoot)) {
      return;
    }

    await unlink(targetPath).catch(() => undefined);
  }

  presignGet(objectKey?: string | null): string | null {
    if (!objectKey || objectKey.trim() === '') return null;
    return objectKey;
  }

  extractObjectKeyFromUrl(url?: string | null): string | null {
    if (!url || url.trim() === '') return null;
    if (url.startsWith('/uploads/')) return url;

    try {
      const parsed = new URL(url);
      return decodeURIComponent(parsed.pathname);
    } catch {
      return url;
    }
  }

  private ext(fileName: string, mimeType?: string): string {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.png')) return '.png';
    if (lower.endsWith('.jpg')) return '.jpg';
    if (lower.endsWith('.jpeg')) return '.jpeg';
    if (lower.endsWith('.svg')) return '.svg';
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/jpeg') return '.jpg';
    if (mimeType === 'image/svg+xml') return '.svg';
    return '';
  }
}
