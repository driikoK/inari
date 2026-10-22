import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Model } from 'mongoose';
import { vi } from 'vitest';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { CrumbAuditService } from '../budget/crumb-audit.service.js';
import { AUDIT_KIND } from '../budget/enums/index.js';
import { MEMBER_KIND, MEMBER_ROLE, SEASON } from '../shared/index.js';
import { UNMARKED_KIND } from './data/filter-members.data.js';
import { IMember } from './interfaces/members.interface.js';
import { MembersService } from './members.service.js';

describe('MembersService', () => {
  const id = '61c0ccf11d7bf83d153d7c06';

  let service: MembersService;
  let model: DeepMocked<Model<IMember>>;
  let crumbAudit: DeepMocked<CrumbAuditService>;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-05-10T12:00:00Z'));

    const module = await Test.createTestingModule({
      providers: [
        MembersService,
        { provide: 'MEMBER_MODEL', useValue: createMock<Model<IMember>>() },
        {
          provide: CrumbAuditService,
          useValue: createMock<CrumbAuditService>(),
        },
      ],
    }).compile();

    service = module.get(MembersService);
    model = module.get('MEMBER_MODEL');
    crumbAudit = module.get(CrumbAuditService);
  });

  afterEach(() => {
    vi.useRealTimers();
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

      const result = await service.createMember(
        { nickname: 'Dixy', types: [MEMBER_ROLE.DUB] },
        'root',
      );

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

      await service.createMember(
        { nickname: 'Dixy', types: [], kind: MEMBER_KIND.GUEST },
        'root',
      );

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ $set: { kind: MEMBER_KIND.GUEST } }),
        expect.anything(),
      );
    });

    it('creates a new member with zero coins when nothing was removed', async () => {
      model.findOneAndUpdate.mockResolvedValue(null);
      model.create.mockResolvedValue({} as any);

      await service.createMember(
        { nickname: 'New', types: [], kind: MEMBER_KIND.TEAM },
        'root',
      );

      expect(model.create).toHaveBeenCalledWith({
        nickname: 'New',
        types: [],
        kind: MEMBER_KIND.TEAM,
        coins: 0,
        crumbsAuditedAt: expect.any(Date),
      });
      expect(crumbAudit.record).not.toHaveBeenCalled();
    });

    it('audits the coins a new nickname starts with, in the current season, by the admin who added it', async () => {
      model.findOneAndUpdate.mockResolvedValue(null);
      model.create.mockResolvedValue({} as any);

      await service.createMember(
        { nickname: 'New', types: [], kind: MEMBER_KIND.TEAM, coins: 40 },
        'boss',
      );

      expect(crumbAudit.record).toHaveBeenCalledWith(
        AUDIT_KIND.MEMBER_CREATED,
        'boss',
        expect.stringContaining('New'),
        [
          {
            change: {
              nickname: 'New',
              season: SEASON.SPRING,
              year: 2027,
              delta: 40,
              coins: 40,
              seasonCoins: 0,
            },
            before: null,
            after: { type: 'member', nickname: 'New', coins: 40, seasons: [] },
          },
        ],
      );
    });

    it('does not touch the audit when a removed nickname is restored', async () => {
      model.findOneAndUpdate.mockResolvedValue({ nickname: 'Dixy' } as any);

      await service.createMember({ nickname: 'Dixy', types: [] }, 'root');

      expect(crumbAudit.record).not.toHaveBeenCalled();
    });
  });

  describe('changeCoins', () => {
    const leanAnswers = (...values: unknown[]) => {
      for (const value of values) {
        model.findOneAndUpdate.mockReturnValueOnce({
          lean: vi.fn().mockResolvedValue(value),
        } as any);
      }
    };

    const call = (index: number) => model.findOneAndUpdate.mock.calls[index];

    const spring = {
      nickname: 'Dixy',
      season: SEASON.SPRING,
      year: 2027,
    };
    const claimed = { crumbsAuditedAt: new Date() };

    const request = (extra: Record<string, unknown> = {}) => ({
      season: SEASON.SPRING,
      year: 2027,
      delta: 10,
      actor: 'boss',
      ...extra,
    });

    it('adds to the total and to the season in one atomic update', async () => {
      leanAnswers(null, {
        coins: 110,
        seasons: [{ season: SEASON.SPRING, year: 2027, coins: 40 }],
      });

      await expect(service.changeCoins('Dixy', request())).resolves.toEqual({
        ...spring,
        delta: 10,
        coins: 110,
        seasonCoins: 40,
      });

      expect(call(1)).toEqual([
        {
          nickname: 'Dixy',
          seasons: { $elemMatch: { season: SEASON.SPRING, year: 2027 } },
        },
        { $inc: { coins: 10, 'seasons.$.coins': 10 } },
        { new: true },
      ]);
    });

    it('adds the role to the roles of the nickname in the same update', async () => {
      leanAnswers(null, { coins: 10, seasons: [] });

      await service.changeCoins('Dixy', request({ role: MEMBER_ROLE.DUB }));

      expect(call(1)[1]).toEqual({
        $inc: { coins: 10, 'seasons.$.coins': 10 },
        $addToSet: { types: MEMBER_ROLE.DUB },
      });
    });

    it('opens a season the nickname has not worked in yet', async () => {
      leanAnswers(null, null, {
        coins: 10,
        seasons: [{ season: SEASON.SPRING, year: 2027, coins: 10 }],
      });

      const change = await service.changeCoins('Dixy', request());

      expect(change).toMatchObject({ coins: 10, seasonCoins: 10 });
      expect(call(2)).toEqual([
        {
          nickname: 'Dixy',
          seasons: {
            $not: {
              $elemMatch: { season: SEASON.SPRING, year: 2027 },
            },
          },
        },
        {
          $inc: { coins: 10 },
          $push: {
            seasons: { season: SEASON.SPRING, year: 2027, coins: 10 },
          },
        },
        { new: true },
      ]);
    });

    it('looks once more when the season was opened by someone else in between', async () => {
      leanAnswers(null, null, null, {
        coins: 25,
        seasons: [{ season: SEASON.SPRING, year: 2027, coins: 25 }],
      });

      await expect(
        service.changeCoins('Dixy', request()),
      ).resolves.toMatchObject({ coins: 25, seasonCoins: 25 });

      expect(model.findOneAndUpdate).toHaveBeenCalledTimes(4);
      expect(call(3)[1]).toEqual({
        $inc: { coins: 10, 'seasons.$.coins': 10 },
      });
    });

    it('takes crumbs only from a counter that has enough, with a margin for float noise', async () => {
      leanAnswers(null, null);
      model.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          nickname: 'Dixy',
          coins: 50,
          seasons: [{ season: SEASON.SPRING, year: 2027, coins: 3 }],
        }),
      } as any);

      await expect(
        service.changeCoins('Dixy', request({ delta: -10 })),
      ).rejects.toThrow(ConflictException);

      const enough = { coins: { $gte: 10 - 0.0005 } };

      expect(call(1)[0]).toEqual({
        nickname: 'Dixy',
        ...enough,
        seasons: {
          $elemMatch: { season: SEASON.SPRING, year: 2027, ...enough },
        },
      });
    });

    it('says how much there is and how much was asked for', async () => {
      leanAnswers(null, null);
      model.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          nickname: 'Dixy',
          seasons: [{ season: SEASON.SPRING, year: 2027, coins: 3.5 }],
        }),
      } as any);

      await expect(
        service.changeCoins('Dixy', request({ delta: -10 })),
      ).rejects.toThrow(/Dixy.*Весна 2027.*3,5.*10/);
    });

    it('never opens a season with a negative balance', async () => {
      leanAnswers(null, null);
      model.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue({ nickname: 'Dixy', seasons: [] }),
      } as any);

      await expect(
        service.changeCoins('Dixy', request({ delta: -10 })),
      ).rejects.toThrow(ConflictException);

      expect(model.findOneAndUpdate).toHaveBeenCalledTimes(2);
    });

    it('does not check the balance when a caller takes back its own change', async () => {
      leanAnswers(null, { coins: 0, seasons: [] });

      await service.changeCoins('Dixy', request({ delta: -10 }), {
        guard: false,
      });

      expect(call(1)[0]).toEqual({
        nickname: 'Dixy',
        seasons: { $elemMatch: { season: SEASON.SPRING, year: 2027 } },
      });
    });

    it('reports a nickname that does not exist', async () => {
      leanAnswers(null, null, null, null, null);
      model.findOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      } as any);

      await expect(service.changeCoins('Ghost', request())).rejects.toThrow(
        'User not found',
      );
    });

    it('writes the opening state of a nickname once, by whoever changes it first', async () => {
      leanAnswers(
        {
          coins: 100,
          seasons: [{ season: SEASON.WINTER, year: 2027, coins: 100 }],
        },
        { coins: 110, seasons: [] },
      );

      await service.changeCoins('Dixy', request());

      expect(call(0)).toEqual([
        { nickname: 'Dixy', crumbsAuditedAt: null },
        { $set: { crumbsAuditedAt: expect.any(Date) } },
        { new: false },
      ]);
      expect(crumbAudit.recordOpening).toHaveBeenCalledWith(
        'boss',
        'Dixy',
        {
          coins: 100,
          seasons: [{ season: SEASON.WINTER, year: 2027, coins: 100 }],
        },
        SEASON.SPRING,
        2027,
      );
    });

    it('writes no opening state when the audit already took over', async () => {
      leanAnswers(null, { coins: 110, seasons: [] });

      await service.changeCoins('Dixy', request());

      expect(crumbAudit.recordOpening).not.toHaveBeenCalled();
    });

    it('gives the claim back and changes nothing when the opening state could not be written', async () => {
      leanAnswers({ ...claimed, coins: 100, seasons: [] });
      crumbAudit.recordOpening.mockRejectedValue(new Error('db down'));

      await expect(service.changeCoins('Dixy', request())).rejects.toThrow(
        'db down',
      );

      expect(model.updateOne).toHaveBeenCalledWith(
        { nickname: 'Dixy' },
        { $unset: { crumbsAuditedAt: 1 } },
      );
      expect(model.findOneAndUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateMember', () => {
    const before = {
      nickname: 'Dixy',
      coins: 100,
      seasons: [{ season: SEASON.SPRING, year: 2027, coins: 60 }],
    };

    const answers = (previous: unknown) => {
      model.findOneAndUpdate
        .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue(null) } as any)
        .mockReturnValueOnce({
          lean: vi.fn().mockResolvedValue(previous),
        } as any);
      model.findOne.mockReturnValue({
        exec: vi.fn().mockResolvedValue({ nickname: 'Dixy' }),
      } as any);
    };

    const sent = (extra: Record<string, unknown> = {}) => ({
      nickname: 'Dixy',
      coins: 120,
      ...extra,
    });

    it('audits a change of the coins by the admin who made it, from before to after', async () => {
      answers(before);

      await service.updateMember(sent(), 'boss');

      expect(crumbAudit.record).toHaveBeenCalledWith(
        AUDIT_KIND.MEMBER_ADJUSTED,
        'boss',
        expect.stringContaining('Dixy'),
        [
          {
            change: {
              nickname: 'Dixy',
              season: SEASON.SPRING,
              year: 2027,
              delta: 20,
              coins: 120,
              seasonCoins: 60,
            },
            before: expect.objectContaining({ type: 'member', coins: 100 }),
            after: expect.objectContaining({ type: 'member', coins: 120 }),
          },
        ],
      );
    });

    it('does not audit a change that leaves the crumbs alone', async () => {
      answers(before);

      await service.updateMember(sent({ coins: 100, types: ['dub'] }), 'boss');

      expect(crumbAudit.record).not.toHaveBeenCalled();
    });

    it('leaves the roles and the seasons alone when they were not sent', async () => {
      answers(before);

      await service.updateMember(sent({ types: null, seasons: null }), 'boss');

      expect(model.findOneAndUpdate.mock.calls[1]).toEqual([
        { nickname: 'Dixy' },
        { $set: { coins: 120 } },
        { new: false },
      ]);
    });

    it('audits a change of one season even when the total stays', async () => {
      answers(before);

      await service.updateMember(
        sent({
          coins: 100,
          seasons: [{ season: SEASON.SPRING, year: 2027, coins: 70 }],
        }),
        'boss',
      );

      expect(crumbAudit.record).toHaveBeenCalledWith(
        AUDIT_KIND.MEMBER_ADJUSTED,
        'boss',
        expect.any(String),
        [
          expect.objectContaining({
            change: expect.objectContaining({ delta: 0, seasonCoins: 70 }),
          }),
        ],
      );
    });

    it('reports a nickname that does not exist', async () => {
      answers(null);

      await expect(service.updateMember(sent(), 'boss')).rejects.toThrow(
        'User not found',
      );
      expect(crumbAudit.record).not.toHaveBeenCalled();
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
