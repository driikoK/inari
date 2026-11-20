import {
  BadRequestException,
  HttpException,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import {
  POSTER_MISSING,
  POSTER_TOO_LARGE,
  POSTER_UNREADABLE,
} from './enums/index.js';

// The size limit is set where the multipart plugin is registered (main.ts)
export const readUpload = async (request: FastifyRequest): Promise<Buffer> => {
  if (!request.isMultipart()) throw new BadRequestException(POSTER_MISSING);

  try {
    const file = await request.file();

    if (!file) throw new BadRequestException(POSTER_MISSING);

    const bytes = await file.toBuffer();

    // toBuffer looks at the flag after every chunk, so a file that crosses the
    // limit in its last chunk comes back cut short with no error
    if (file.file.truncated) {
      throw new PayloadTooLargeException(POSTER_TOO_LARGE);
    }

    return bytes;
  } catch (error) {
    if (error instanceof HttpException) throw error;

    if ((error as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') {
      throw new PayloadTooLargeException(POSTER_TOO_LARGE);
    }

    // A body that has no boundary or stops half way is the client's fault
    throw new BadRequestException(POSTER_UNREADABLE);
  }
};
