import { randomUUID } from 'node:crypto';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';

import type { AppConfig } from '../config/configuration.js';
import {
  MAX_POSTER_PIXELS,
  MAX_POSTER_SIDE,
  POSTER_FILE,
  POSTER_FORMATS,
  POSTER_NOT_AN_IMAGE,
  POSTER_QUALITY,
} from './enums/index.js';

@Injectable()
export class PostersService {
  private readonly logger = new Logger(PostersService.name);
  readonly dir: string;
  private readonly baseUrl: string;

  constructor(config: ConfigService<AppConfig, true>) {
    this.dir = config.get('posters.dir', { infer: true });
    this.baseUrl = config.get('posters.url', { infer: true });
  }

  urlOf(file: string): string {
    return `${this.baseUrl}/${file}`;
  }

  ensureDir(): Promise<unknown> {
    return mkdir(this.dir, { recursive: true });
  }

  // Whatever arrives is decoded and written again as WebP, so the file on the
  // disk is always an image this code made, never the bytes the client sent.
  async save(upload: Buffer): Promise<string> {
    let output: Buffer;

    try {
      const image = sharp(upload, { limitInputPixels: MAX_POSTER_PIXELS });
      const { format } = await image.metadata();

      if (!format || !POSTER_FORMATS.includes(format)) {
        throw new BadRequestException(POSTER_NOT_AN_IMAGE);
      }

      output = await image
        .rotate()
        .resize({
          width: MAX_POSTER_SIDE,
          height: MAX_POSTER_SIDE,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: POSTER_QUALITY })
        .toBuffer();
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      throw new BadRequestException(POSTER_NOT_AN_IMAGE);
    }

    const file = `${randomUUID()}.webp`;
    const temporary = join(this.dir, `.${file}.tmp`);

    await this.ensureDir();

    try {
      await writeFile(temporary, output);
      await rename(temporary, join(this.dir, file));
    } catch (error) {
      await rm(temporary, { force: true }).catch(() => undefined);

      throw error;
    }

    return file;
  }

  // A file that cannot be removed only wastes space, so it is logged and the
  // request that asked for it still succeeds.
  async remove(file: string | undefined): Promise<void> {
    if (!file || !POSTER_FILE.test(file)) return;

    try {
      await rm(join(this.dir, file), { force: true });
    } catch (error) {
      this.logger.warn(`Cannot remove poster ${file}: ${String(error)}`);
    }
  }
}
