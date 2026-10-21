import { Test } from '@nestjs/testing';
import { Model } from 'mongoose';
import { vi } from 'vitest';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { MEMBER_ROLE } from '../shared/index.js';
import { IMember } from './interfaces/members.interface.js';
import { MembersService } from './members.service.js';

describe('MembersService', () => {
  const id = '61c0ccf11d7bf83d153d7c06';

  let service: MembersService;
  let model: DeepMocked<Model<IMember>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: 'MEMBER_MODEL', useValue: createMock<Model<IMember>>() },
      ],
    }).compile();

    service = module.get(MembersService);
    model = module.get('MEMBER_MODEL');
  });

  describe('findAll', () => {
    const sort = vi.fn().mockResolvedValue([]);

    beforeEach(() => {
      model.find.mockImplementation(() => ({ sort }) as any);
    });

    it('lists only nicknames that were not removed', async () => {
      await service.findAll({});

      expect(model.find).toHaveBeenCalledWith({ deletedAt: null });
    });

    it('keeps that filter next to the others', async () => {
      await service.findAll({ role: MEMBER_ROLE.DUB });

      expect(model.find).toHaveBeenCalledWith({
        deletedAt: null,
        types: { $in: [MEMBER_ROLE.DUB] },
      });
    });
  });

  describe('createMember', () => {
    it('restores a nickname that was removed earlier and keeps its coins', async () => {
      const restored = { nickname: 'Dixy', coins: 42 };
      model.findOneAndUpdate.mockResolvedValue(restored as any);

      const result = await service.createMember({
        nickname: 'Dixy',
        types: [MEMBER_ROLE.DUB],
      });

      expect(result).toBe(restored);
      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { nickname: 'Dixy', deletedAt: { $ne: null } },
        {
          $unset: { deletedAt: 1 },
          $addToSet: { types: { $each: [MEMBER_ROLE.DUB] } },
        },
        { new: true },
      );
      expect(model.create).not.toHaveBeenCalled();
    });

    it('creates a new member with zero coins when nothing was removed', async () => {
      model.findOneAndUpdate.mockResolvedValue(null);
      model.create.mockResolvedValue({} as any);

      await service.createMember({ nickname: 'New', types: [] });

      expect(model.create).toHaveBeenCalledWith({
        nickname: 'New',
        types: [],
        coins: 0,
      });
    });
  });

  describe('deleteMember', () => {
    it('hides the nickname instead of deleting it', async () => {
      model.updateOne.mockResolvedValue({ matchedCount: 1 } as any);

      await expect(service.deleteMember(id)).resolves.toBe(true);

      expect(model.updateOne).toHaveBeenCalledWith(
        { _id: id, deletedAt: null },
        { $set: { deletedAt: expect.any(Date) } },
      );
      expect(model.deleteOne).not.toHaveBeenCalled();
    });

    it('reports a nickname that is unknown or already removed', async () => {
      model.updateOne.mockResolvedValue({ matchedCount: 0 } as any);

      await expect(service.deleteMember(id)).rejects.toThrow(
        'Нікнейм не знайдено',
      );
    });

    it('rejects an id that is not an ObjectId without touching the database', async () => {
      await expect(service.deleteMember('nope')).rejects.toThrow('Невірний id');

      expect(model.updateOne).not.toHaveBeenCalled();
    });
  });
});
