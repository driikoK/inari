import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { vi } from 'vitest';

import type { AppConfig } from '../config/configuration.js';
import { POSTER_NOT_AN_IMAGE } from './enums/index.js';
import { PostersService } from './posters.service.js';

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();

  return { ...actual, rename: vi.fn(actual.rename) };
});

const picture = (width: number, height: number) =>
  sharp({
    create: { width, height, channels: 3, background: '#c0392b' },
  });

describe('PostersService', () => {
  let parent: string;
  let dir: string;
  let service: PostersService;

  const stored = () => readdir(dir);
  const decoded = async (file: string) => {
    const bytes = await readFile(join(dir, file));

    return { bytes, ...(await sharp(bytes).metadata()) };
  };

  beforeEach(async () => {
    parent = await mkdtemp(join(tmpdir(), 'inari-posters-'));
    dir = join(parent, 'posters');
    await mkdir(dir);

    const config = {
      get: (key: string) =>
        key === 'posters.dir' ? dir : 'https://api.test/posters',
    } as unknown as ConfigService<AppConfig, true>;

    service = new PostersService(config);
  });

  afterEach(() => rm(parent, { recursive: true, force: true }));

  describe('save', () => {
    it('writes a WebP under a name of its own and gives the name back', async () => {
      const file = await service.save(
        await picture(400, 600).jpeg().toBuffer(),
      );

      expect(file).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/,
      );
      expect(await stored()).toEqual([file]);
      expect((await decoded(file)).format).toBe('webp');
    });

    it('gives two uploads two different names', async () => {
      const upload = await picture(40, 60).png().toBuffer();

      expect(await service.save(upload)).not.toBe(await service.save(upload));
    });

    it('shrinks a big picture to 800 px on the longer side and keeps its proportions', async () => {
      const { width, height } = await decoded(
        await service.save(await picture(2000, 3000).jpeg().toBuffer()),
      );

      expect(height).toBe(800);
      expect(width).toBe(533);
    });

    it('never makes a small picture bigger', async () => {
      const { width, height } = await decoded(
        await service.save(await picture(200, 300).png().toBuffer()),
      );

      expect([width, height]).toEqual([200, 300]);
    });

    it.each([
      ['PNG', () => picture(100, 150).png().toBuffer()],
      ['WebP', () => picture(100, 150).webp().toBuffer()],
      ['JPEG', () => picture(100, 150).jpeg().toBuffer()],
    ])('accepts a %s', async (_name, make) => {
      expect((await decoded(await service.save(await make()))).format).toBe(
        'webp',
      );
    });

    it('turns a photo the way its orientation says and drops the metadata', async () => {
      const upload = await picture(100, 50)
        .jpeg()
        .withMetadata({ orientation: 6 })
        .toBuffer();
      const { width, height, exif } = await decoded(await service.save(upload));

      expect([width, height]).toEqual([50, 100]);
      expect(exif).toBeUndefined();
    });

    it.each([
      ['a GIF', () => picture(10, 10).gif().toBuffer()],
      [
        'an SVG',
        async () =>
          Buffer.from(
            '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script></svg>',
          ),
      ],
      ['a text file', async () => Buffer.from('just some words')],
      ['no bytes at all', async () => Buffer.alloc(0)],
      [
        'a JPEG cut in half',
        async () => {
          const whole = await picture(300, 300).jpeg().toBuffer();

          return whole.subarray(0, whole.length / 2);
        },
      ],
    ])('refuses %s and writes nothing', async (_name, make) => {
      const upload = await make();

      await expect(service.save(upload)).rejects.toThrow(
        new BadRequestException(POSTER_NOT_AN_IMAGE),
      );
      expect(await stored()).toEqual([]);
    });

    it('refuses a picture with more pixels than it is willing to decode', async () => {
      const upload = await picture(7000, 7000)
        .png({ compressionLevel: 9 })
        .toBuffer();

      await expect(service.save(upload)).rejects.toThrow(BadRequestException);
      expect(await stored()).toEqual([]);
    }, 30_000);

    it('creates the folder when it is not there yet', async () => {
      await rm(dir, { recursive: true });

      const file = await service.save(await picture(10, 10).png().toBuffer());

      expect(await stored()).toEqual([file]);
    });

    it('leaves no half-written file behind', async () => {
      await service.save(await picture(10, 10).png().toBuffer());

      expect((await stored()).some((name) => name.endsWith('.tmp'))).toBe(
        false,
      );
    });

    it('takes the temporary file away and passes the error on when the write fails halfway', async () => {
      vi.mocked(rename).mockRejectedValueOnce(new Error('disk full'));

      await expect(
        service.save(await picture(10, 10).png().toBuffer()),
      ).rejects.toThrow('disk full');
      expect(await stored()).toEqual([]);
    });
  });

  describe('remove', () => {
    it('deletes the file', async () => {
      const file = await service.save(await picture(10, 10).png().toBuffer());

      await service.remove(file);

      expect(await stored()).toEqual([]);
    });

    it('is quiet about a file that is gone and about no file at all', async () => {
      await expect(service.remove(undefined)).resolves.toBeUndefined();
      await expect(
        service.remove('3f2b8c1e-0d4a-4b9a-8e5f-1a2b3c4d5e6f.webp'),
      ).resolves.toBeUndefined();
    });

    it.each([
      '../outside.webp',
      '..\\outside.webp',
      'outside.webp',
      '3f2b8c1e-0d4a-4b9a-8e5f-1a2b3c4d5e6f.png',
      '/etc/passwd',
    ])(
      'does not touch anything that is not a name it gave out: %s',
      async (name) => {
        await writeFile(join(parent, 'outside.webp'), 'keep');
        await writeFile(join(dir, 'outside.webp'), 'keep');

        await service.remove(name);

        expect(await readFile(join(parent, 'outside.webp'), 'utf8')).toBe(
          'keep',
        );
        expect(await stored()).toContain('outside.webp');
      },
    );
  });

  describe('urlOf', () => {
    it('puts the name after the public address of the folder', () => {
      expect(service.urlOf('a.webp')).toBe('https://api.test/posters/a.webp');
    });
  });
});
