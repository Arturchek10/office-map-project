import { BadRequestException, Injectable } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join, resolve } from 'path';

@Injectable()
export class LocalFileStorageService {
  private readonly uploadsRoot = resolve(process.cwd(), 'uploads');

  async uploadImage(
    file: Express.Multer.File | undefined,
    folder = 'offices',
    objectKey?: string | null,
  ): Promise<string> {
    if (!file || file.size === 0) {
      throw new BadRequestException('File is empty');
    }

    const safeFolder = this.safePathPart(folder);
    const uploadDir = resolve(this.uploadsRoot, safeFolder);
    if (!uploadDir.startsWith(this.uploadsRoot)) {
      throw new BadRequestException('Upload folder is invalid');
    }

    await mkdir(uploadDir, { recursive: true });

    const originalName = file.originalname || 'image';
    const fileName = objectKey
      ? `${this.safeBaseName(objectKey)}${this.ext(originalName, file.mimetype)}`
      : `${Date.now()}-${process.hrtime.bigint()}${this.ext(originalName, file.mimetype)}`;
    const targetPath = join(uploadDir, fileName);

    await writeFile(targetPath, file.buffer);

    return `/uploads/${safeFolder}/${fileName}`;
  }

  async deleteImage(objectKey?: string | null): Promise<void> {
    if (!objectKey || objectKey.trim() === '') return;

    const pathPart = objectKey.startsWith('http')
      ? new URL(objectKey).pathname
      : objectKey;
    const normalized = pathPart.replace(/^\/+/, '');
    const targetPath = resolve(process.cwd(), normalized);

    if (!targetPath.startsWith(this.uploadsRoot)) {
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
    const extension = extname(fileName).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.svg'].includes(extension)) {
      return extension;
    }
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/jpeg') return '.jpg';
    if (mimeType === 'image/svg+xml') return '.svg';
    return '';
  }

  private safePathPart(value: string): string {
    const safe = value.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    return safe || 'files';
  }

  private safeBaseName(value: string): string {
    const safe = value
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return safe || `${Date.now()}-${process.hrtime.bigint()}`;
  }
}
