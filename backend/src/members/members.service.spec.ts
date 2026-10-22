import { Test } from '@nestjs/testing';
import { Model } from 'mongoose';
import { vi } from 'vitest';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { MEMBER_KIND, MEMBER_ROLE, SEASON } from '../shared/index.js';
import { UNMARKED_KIND } from './data/filter-members.data.js';
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

  describe('getAllRoles', () => {
    it('has a label for every member role and none twice, as the one list of roles the frontend uses', () => {
      const roles = service.getAllRoles();

      expect(roles.map(({ value }) => value).sort()).toEqual(
        Object.values(MEMBER_ROLE).sort(),
      );
      expect(roles.every(({ label }) => label.trim() !== '')).toBe(true);
    });

    it('calls the fixer «Контроль якості», the sound role «Звукорежисер» and keeps the role breaker', () => {
      const label = (role: MEMBER_ROLE) =>
        service.getAllRoles().find(({ value }) => value === role)?.label;

      expect(label(MEMBER_ROLE.FIXER)).toBe('Контроль якості');
      expect(label(MEMBER_ROLE.SOUND)).toBe('Звукорежисер');
      expect(label(MEMBER_ROLE.ROLE_BREAKER)).toBe('Розбивач ролей');
    });
  });

  describe('findAll by kind', () => {
    const sort = vi.fn().mockResolvedValue([]);

    beforeEach(() => {
      model.find.mockImplementation(() => ({ sort }) as any);
    });

    it('lists guests only', async () => {
      await service.findAll({ kind: MEMBER_KIND.GUEST });

      expect(model.find).toHaveBeenCalledWith({
        deletedAt: null,
        kind: MEMBER_KIND.GUEST,
      });
    });

    it('lists the nicknames that were never marked, which have no kind or a null one', async () => {
      await service.findAll({ kind: UNMARKED_KIND });

      expect(model.find).toHaveBeenCalledWith({ deletedAt: null, kind: null });
    });
  });

  describe('getCoinsTotal', () => {
    const matchOf = () => (model.aggregate.mock.calls[0][0] as any[])[0].$match;
    const projectOf = () =>
      (model.aggregate.mock.calls[0][0] as any[])[1].$project;

    beforeEach(() => {
      model.aggregate.mockResolvedValue([]);
    });

    it('counts only the nicknames that were not removed, guests included by default', async () => {
      await service.getCoinsTotal({ includeGuests: true });

      expect(matchOf()).toEqual({ deletedAt: null });
      expect(projectOf().coins).toBe('$coins');
    });

    it('leaves out the guests but keeps the nicknames without a kind', async () => {
      await service.getCoinsTotal({ includeGuests: false });

      expect(matchOf()).toEqual({
        deletedAt: null,
        kind: { $ne: MEMBER_KIND.GUEST },
      });
    });

    it('sums the coins of one season and takes only nicknames that have it', async () => {
      await service.getCoinsTotal({
        season: SEASON.WINTER,
        year: 2025,
        includeGuests: true,
      });

      expect(matchOf()).toEqual({
        deletedAt: null,
        seasons: { $elemMatch: { season: SEASON.WINTER, year: 2025 } },
      });
      expect(projectOf().coins).not.toBe('$coins');
    });

    it('returns the total and how many nicknames without a kind it contains', async () => {
      model.aggregate.mockResolvedValue([{ total: 120.5, unmarkedCount: 3 }]);

      await expect(
        service.getCoinsTotal({ includeGuests: true }),
      ).resolves.toEqual({ total: 120.5, unmarkedCount: 3 });
    });

    it('rounds float noise away', async () => {
      model.aggregate.mockResolvedValue([
        { total: 0.1 + 0.2, unmarkedCount: 0 },
      ]);

      const { total } = await service.getCoinsTotal({ includeGuests: true });

      expect(total).toBe(0.3);
    });

    it('answers zeros when nothing matches', async () => {
      await expect(
        service.getCoinsTotal({ includeGuests: true }),
      ).resolves.toEqual({ total: 0, unmarkedCount: 0 });
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

    it('applies the kind chosen on re-adding to the restored nickname', async () => {
      model.findOneAndUpdate.mockResolvedValue({} as any);

      await service.createMember({
        nickname: 'Dixy',
        types: [],
        kind: MEMBER_KIND.GUEST,
      });

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ $set: { kind: MEMBER_KIND.GUEST } }),
        expect.anything(),
      );
    });

    it('creates a new member with zero coins when nothing was removed', async () => {
      model.findOneAndUpdate.mockResolvedValue(null);
      model.create.mockResolvedValue({} as any);

      await service.createMember({
        nickname: 'New',
        types: [],
        kind: MEMBER_KIND.TEAM,
      });

      expect(model.create).toHaveBeenCalledWith({
        nickname: 'New',
        types: [],
        kind: MEMBER_KIND.TEAM,
        coins: 0,
      });
    });
  });

  describe('updateKind', () => {
    it('marks a visible nickname and returns it', async () => {
      const updated = { nickname: 'Dixy', kind: MEMBER_KIND.GUEST };
      model.findOneAndUpdate.mockResolvedValue(updated as any);

      await expect(service.updateKind(id, MEMBER_KIND.GUEST)).resolves.toBe(
        updated,
      );

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: id, deletedAt: null },
        { $set: { kind: MEMBER_KIND.GUEST } },
        { new: true },
      );
    });

    it('reports a nickname that is unknown or removed', async () => {
      model.findOneAndUpdate.mockResolvedValue(null);

      await expect(service.updateKind(id, MEMBER_KIND.TEAM)).rejects.toThrow(
        'Нікнейм не знайдено',
      );
    });

    it('rejects an id that is not an ObjectId without touching the database', async () => {
      await expect(
        service.updateKind('nope', MEMBER_KIND.TEAM),
      ).rejects.toThrow('Невірний id');

      expect(model.findOneAndUpdate).not.toHaveBeenCalled();
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
