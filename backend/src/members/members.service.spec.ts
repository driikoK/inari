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

  describe('getCoinsOf', () => {
    const member = (overrides: Partial<IMember> = {}) =>
      ({
        nickname: 'Dixy',
        coins: 120.5,
        seasons: [
          { season: SEASON.WINTER, year: 2026, coins: 30 },
          { season: SEASON.SPRING, year: 2026, coins: 90.5 },
        ],
        ...overrides,
      }) as IMember;

    const found = (value: IMember | null) =>
      model.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(value),
      } as any);

    it('answers the total and the coins of the season the day falls in', async () => {
      found(member());

      await expect(service.getCoinsOf('Dixy', '2026-05-10')).resolves.toEqual({
        nickname: 'Dixy',
        coins: 120.5,
        currentSeason: { season: SEASON.SPRING, year: 2026, coins: 90.5 },
      });
      expect(model.findOne).toHaveBeenCalledWith({
        nickname: 'Dixy',
        deletedAt: null,
      });
    });

    it('answers zero for a season the nickname has not worked in', async () => {
      found(member());

      const { currentSeason } = await service.getCoinsOf('Dixy', '2026-08-01');

      expect(currentSeason).toEqual({
        season: SEASON.SUMMER,
        year: 2026,
        coins: 0,
      });
    });

    it('treats a nickname without counters as empty and rounds float noise away', async () => {
      found(member({ coins: 0.1 + 0.2, seasons: undefined }));

      await expect(service.getCoinsOf('Dixy', '2026-05-10')).resolves.toEqual(
        expect.objectContaining({
          coins: 0.3,
          currentSeason: expect.objectContaining({ coins: 0 }),
        }),
      );
    });

    it('answers an empty balance without a lookup when the account has no nickname', async () => {
      await expect(
        service.getCoinsOf(undefined, '2026-05-10'),
      ).resolves.toEqual({
        nickname: null,
        coins: 0,
        currentSeason: { season: SEASON.SPRING, year: 2026, coins: 0 },
      });
      expect(model.findOne).not.toHaveBeenCalled();
    });

    it('answers an empty balance when the nickname was hidden', async () => {
      found(null);

      const result = await service.getCoinsOf('Dixy', '2026-05-10');

      expect(result.nickname).toBeNull();
      expect(result.coins).toBe(0);
    });
  });

  describe('findByNickname', () => {
    it('also finds a hidden nickname, the caller decides what to do with it', async () => {
      const hidden = { nickname: 'Dixy', deletedAt: new Date() };
      model.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue(hidden),
      } as any);

      await expect(service.findByNickname('Dixy')).resolves.toBe(hidden);

      expect(model.findOne).toHaveBeenCalledWith({ nickname: 'Dixy' });
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
