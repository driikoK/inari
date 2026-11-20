import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { vi } from 'vitest';

import {
  POSTER_MISSING,
  POSTER_TOO_LARGE,
  POSTER_UNREADABLE,
} from './enums/index.js';
import { readUpload } from './upload.js';

const request = (parts: {
  isMultipart?: boolean;
  failure?: Error;
  file?: {
    toBuffer: () => Promise<Buffer>;
    file?: { truncated: boolean };
  };
}) =>
  ({
    isMultipart: () => parts.isMultipart ?? true,
    file: parts.failure
      ? vi.fn().mockRejectedValue(parts.failure)
      : vi
          .fn()
          .mockResolvedValue(
            parts.file && { file: { truncated: false }, ...parts.file },
          ),
  }) as unknown as FastifyRequest;

describe('readUpload', () => {
  it('gives back the bytes of the file', async () => {
    const bytes = Buffer.from('image');

    await expect(
      readUpload(request({ file: { toBuffer: async () => bytes } })),
    ).resolves.toBe(bytes);
  });

  it('asks for a file when the request is not multipart', async () => {
    await expect(readUpload(request({ isMultipart: false }))).rejects.toThrow(
      new BadRequestException(POSTER_MISSING),
    );
  });

  it('asks for a file when the form has none', async () => {
    await expect(readUpload(request({ file: undefined }))).rejects.toThrow(
      new BadRequestException(POSTER_MISSING),
    );
  });

  it('answers 413 when the file is over the limit', async () => {
    const tooLarge = Object.assign(new Error('too large'), {
      code: 'FST_REQ_FILE_TOO_LARGE',
    });

    await expect(
      readUpload(
        request({ file: { toBuffer: () => Promise.reject(tooLarge) } }),
      ),
    ).rejects.toThrow(new PayloadTooLargeException(POSTER_TOO_LARGE));
  });

  it('answers 413 for a file that crossed the limit in its last chunk and came back cut short', async () => {
    await expect(
      readUpload(
        request({
          file: {
            toBuffer: async () => Buffer.from('cut'),
            file: { truncated: true },
          },
        }),
      ),
    ).rejects.toThrow(new PayloadTooLargeException(POSTER_TOO_LARGE));
  });

  it('answers 400 for a body with no boundary, which the plugin cannot even start to read', async () => {
    await expect(
      readUpload(
        request({ failure: new Error('Multipart: Boundary not found') }),
      ),
    ).rejects.toThrow(new BadRequestException(POSTER_UNREADABLE));
  });

  it('answers 400 for a body that stops half way', async () => {
    await expect(
      readUpload(
        request({
          file: {
            toBuffer: () =>
              Promise.reject(new Error('Unexpected end of multipart data')),
          },
        }),
      ),
    ).rejects.toThrow(new BadRequestException(POSTER_UNREADABLE));
  });
});
