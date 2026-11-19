import { Test } from '@nestjs/testing';
import { Model } from 'mongoose';
import { vi } from 'vitest';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { DEFAULT_CODEX } from './codex.default.js';
import { CodexService } from './codex.service.js';
import type { CodexContent } from './data/codex.data.js';
import type { ICodex } from './interfaces/index.js';

const content: CodexContent = {
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Новий' }] }],
};
const saved = new Date('2027-05-10T09:00:00Z');

describe('CodexService', () => {
  let service: CodexService;
  let model: DeepMocked<Model<ICodex>>;

  const resolves = (value: unknown) => ({
    lean: vi.fn().mockResolvedValue(value),
  });
  const rejects = (error: unknown) => ({
    lean: vi.fn().mockRejectedValue(error),
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CodexService,
        { provide: 'CODEX_MODEL', useValue: createMock<Model<ICodex>>() },
      ],
    }).compile();

    service = module.get(CodexService);
    model = module.get('CODEX_MODEL');
  });

  describe('get', () => {
    it('gives the text the team had before, and no date, until a text is saved', async () => {
      model.findById.mockReturnValue(resolves(null) as never);

      await expect(service.get()).resolves.toEqual({
        content: DEFAULT_CODEX,
        updatedAt: null,
      });
      expect(model.findById).toHaveBeenCalledWith('codex');
    });

    it('gives the saved text with the day it was saved', async () => {
      model.findById.mockReturnValue(
        resolves({
          _id: 'codex',
          content,
          updatedBy: 'boss',
          updatedAt: saved,
        }) as never,
      );

      await expect(service.get()).resolves.toEqual({
        content,
        updatedAt: saved,
      });
    });

    it('does not say who saved it', async () => {
      model.findById.mockReturnValue(
        resolves({
          _id: 'codex',
          content,
          updatedBy: 'boss',
          updatedAt: saved,
        }) as never,
      );

      expect(Object.keys(await service.get())).toEqual([
        'content',
        'updatedAt',
      ]);
    });
  });

  describe('save', () => {
    it('writes the one document, creating it when there is none, and keeps who saved it', async () => {
      model.findOneAndUpdate.mockReturnValue(
        resolves({ _id: 'codex', content, updatedAt: saved }) as never,
      );

      await expect(service.save({ content }, 'boss')).resolves.toEqual({
        content,
        updatedAt: saved,
      });
      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'codex' },
        { $set: { content, updatedBy: 'boss' } },
        { upsert: true, new: true },
      );
    });

    it('goes again as an update when two first saves met on the unique id', async () => {
      model.findOneAndUpdate
        .mockReturnValueOnce(rejects({ code: 11000 }) as never)
        .mockReturnValueOnce(
          resolves({ _id: 'codex', content, updatedAt: saved }) as never,
        );

      await expect(service.save({ content }, 'boss')).resolves.toEqual({
        content,
        updatedAt: saved,
      });
      expect(model.findOneAndUpdate).toHaveBeenCalledTimes(2);
    });

    it('lets any other failure through', async () => {
      model.findOneAndUpdate.mockReturnValue(
        rejects(new Error('db down')) as never,
      );

      await expect(service.save({ content }, 'boss')).rejects.toThrow(
        'db down',
      );
      expect(model.findOneAndUpdate).toHaveBeenCalledTimes(1);
    });

    it('does not go a third time when the second one fails too', async () => {
      model.findOneAndUpdate.mockReturnValue(rejects({ code: 11000 }) as never);

      await expect(service.save({ content }, 'boss')).rejects.toEqual({
        code: 11000,
      });
      expect(model.findOneAndUpdate).toHaveBeenCalledTimes(2);
    });
  });
});
