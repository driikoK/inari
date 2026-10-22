import { ConflictException, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { vi } from 'vitest';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { CrumbAuditService } from '../budget/crumb-audit.service.js';
import type { CrumbsChange } from '../budget/crumbs.js';
import { AUDIT_KIND } from '../budget/enums/index.js';
import { DictionariesService } from '../dictionaries/dictionaries.service.js';
import { MembersService } from '../members/members.service.js';
import { ANIME_TYPE, MEMBER_ROLE, SEASON } from '../shared/index.js';
import { UsersService } from '../users/users.service.js';
import type { CreateTrackData } from './data/create-track.data.js';
import { ITrack } from './interfaces/track.interface.js';
import { TrackService } from './tracks.service.js';

describe('TrackService', () => {
  const id = String(new Types.ObjectId());

  let service: TrackService;
  let model: DeepMocked<Model<ITrack>>;
  let members: DeepMocked<MembersService>;
  let crumbAudit: DeepMocked<CrumbAuditService>;
  let users: DeepMocked<UsersService>;

  const stored = (extra: Partial<ITrack> = {}) =>
    ({
      _id: id,
      nickname: 'Аня',
      nameTitle: 'Вітробой',
      currentEpisode: 3,
      typeRole: MEMBER_ROLE.DUB,
      titleType: ANIME_TYPE.SERIES,
      season: SEASON.SPRING,
      year: 2027,
      coins: 12,
      ...extra,
    }) as ITrack;

  const changeOf = (extra: Partial<CrumbsChange> = {}): CrumbsChange => ({
    nickname: 'Аня',
    season: SEASON.SPRING,
    year: 2027,
    delta: -12,
    coins: 88,
    seasonCoins: 28,
    ...extra,
  });

  beforeEach(async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const module = await Test.createTestingModule({
      providers: [
        TrackService,
        { provide: 'TRACK_MODEL', useValue: createMock<Model<ITrack>>() },
        { provide: MembersService, useValue: createMock<MembersService>() },
        {
          provide: DictionariesService,
          useValue: createMock<DictionariesService>(),
        },
        { provide: UsersService, useValue: createMock<UsersService>() },
        {
          provide: CrumbAuditService,
          useValue: createMock<CrumbAuditService>(),
        },
      ],
    }).compile();

    service = module.get(TrackService);
    model = module.get('TRACK_MODEL');
    members = module.get(MembersService);
    crumbAudit = module.get(CrumbAuditService);
    users = module.get(UsersService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCoinsBySeason', () => {
    it('sums the coins of every track by season, whoever earned them', async () => {
      model.aggregate.mockResolvedValue([
        { _id: { season: SEASON.SPRING, year: 2026 }, coins: 1200.5 },
        { _id: { season: SEASON.SUMMER, year: 2026 }, coins: 80 },
      ]);

      await expect(service.getCoinsBySeason()).resolves.toEqual([
        { season: SEASON.SPRING, year: 2026, coins: 1200.5 },
        { season: SEASON.SUMMER, year: 2026, coins: 80 },
      ]);
      expect(model.aggregate).toHaveBeenCalledWith([
        {
          $group: {
            _id: { season: '$season', year: '$year' },
            coins: { $sum: '$coins' },
          },
        },
      ]);
    });

    it('rounds float noise away', async () => {
      model.aggregate.mockResolvedValue([
        { _id: { season: SEASON.FALL, year: 2026 }, coins: 0.1 + 0.2 },
      ]);

      const [fall] = await service.getCoinsBySeason();

      expect(fall.coins).toBe(0.3);
    });

    it('answers an empty list when there are no tracks', async () => {
      model.aggregate.mockResolvedValue([]);

      await expect(service.getCoinsBySeason()).resolves.toEqual([]);
    });
  });

  describe('create', () => {
    const track = (): CreateTrackData => ({
      membersInfo: [
        { nickname: 'Аня', typeRole: MEMBER_ROLE.DUB, coins: 10 },
        { nickname: 'Борис', typeRole: MEMBER_ROLE.SOUND, coins: 5 },
      ],
      currentEpisode: 3,
      nameTitle: 'Вітробой',
      titleType: ANIME_TYPE.SERIES,
      season: SEASON.SPRING,
      year: 2027,
      username: 'root',
    });

    beforeEach(() => {
      users.findOneByUsername.mockResolvedValue({ username: 'root' } as any);
      members.findMember.mockResolvedValue({} as any);
      model.create.mockImplementation((async (doc: object) => ({
        ...doc,
        _id: new Types.ObjectId(),
      })) as any);
      members.changeCoins.mockImplementation(async (nickname, request) => ({
        nickname,
        season: request.season,
        year: request.year,
        delta: request.delta,
        coins: 100 + request.delta,
        seasonCoins: 50 + request.delta,
      }));
    });

    it('gives every nickname its crumbs in the season of the track, with its role', async () => {
      await expect(service.create(track(), 'boss')).resolves.toBe('Success');

      expect(model.create).toHaveBeenCalledTimes(2);
      expect(members.changeCoins).toHaveBeenCalledWith('Аня', {
        season: SEASON.SPRING,
        year: 2027,
        delta: 10,
        role: MEMBER_ROLE.DUB,
        actor: 'boss',
      });
      expect(members.changeCoins).toHaveBeenCalledWith('Борис', {
        season: SEASON.SPRING,
        year: 2027,
        delta: 5,
        role: MEMBER_ROLE.SOUND,
        actor: 'boss',
      });
    });

    it('audits the whole track as one operation, a row for every nickname, by the user who sent it', async () => {
      await service.create(track(), 'boss');

      expect(crumbAudit.record).toHaveBeenCalledTimes(1);

      const [kind, actor, description, items] = crumbAudit.record.mock
        .calls[0] as [AUDIT_KIND, string, string, any[]];

      expect([kind, actor]).toEqual([AUDIT_KIND.TRACK_CREATED, 'boss']);
      expect(description).toContain('Вітробой');
      expect(description).toContain('Аня +10');
      expect(description).toContain('Борис +5');
      expect(items).toHaveLength(2);
      expect(items[0]).toMatchObject({
        change: { nickname: 'Аня', delta: 10 },
        before: null,
        after: {
          type: 'track',
          nickname: 'Аня',
          nameTitle: 'Вітробой',
          currentEpisode: 3,
          typeRole: MEMBER_ROLE.DUB,
          coins: 10,
        },
      });
      expect(items[0].entryId).toEqual(expect.any(String));
    });

    it('refuses a removed nickname and writes nothing', async () => {
      members.findMember.mockResolvedValue({ deletedAt: new Date() } as any);

      await expect(service.create(track(), 'boss')).rejects.toThrow(
        'видалено зі списку',
      );

      expect(model.create).not.toHaveBeenCalled();
      expect(crumbAudit.record).not.toHaveBeenCalled();
    });

    it('takes back what was given and removes the tracks when a later nickname fails', async () => {
      const created: string[] = [];

      model.create.mockImplementation((async (doc: object) => {
        const _id = new Types.ObjectId();

        created.push(String(_id));

        return { ...doc, _id };
      }) as any);
      members.changeCoins
        .mockResolvedValueOnce(changeOf({ delta: 10 }))
        .mockRejectedValueOnce(new Error('db down'));

      await expect(service.create(track(), 'boss')).rejects.toThrow('db down');

      expect(members.changeCoins).toHaveBeenLastCalledWith(
        'Аня',
        {
          season: SEASON.SPRING,
          year: 2027,
          delta: -10,
          actor: 'boss',
        },
        { guard: false },
      );
      expect(model.deleteOne.mock.calls.map(([filter]) => filter)).toEqual(
        expect.arrayContaining(created.map((_id) => ({ _id }))),
      );
      expect(model.deleteOne).toHaveBeenCalledTimes(2);
      expect(crumbAudit.record).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const patch = (coins: number) => ({ coins, username: 'root' });

    beforeEach(() => {
      model.findById.mockResolvedValue(stored({ coins: 10 }) as any);
      members.changeCoins.mockResolvedValue(changeOf({ delta: 5 }));
      model.findOneAndUpdate.mockResolvedValue(stored({ coins: 15 }) as any);
    });

    it('moves the counters of the nickname by the difference, in the season of the track', async () => {
      await service.update(id, patch(15), 'boss');

      expect(members.changeCoins).toHaveBeenCalledWith('Аня', {
        season: SEASON.SPRING,
        year: 2027,
        delta: 5,
        actor: 'boss',
      });
    });

    it('audits the change from before to after, by the user who made it', async () => {
      await service.update(id, patch(15), 'boss');

      expect(crumbAudit.record).toHaveBeenCalledWith(
        AUDIT_KIND.TRACK_UPDATED,
        'boss',
        expect.stringContaining('Вітробой'),
        [
          {
            change: changeOf({ delta: 5 }),
            entryId: id,
            before: expect.objectContaining({ coins: 10 }),
            after: expect.objectContaining({ coins: 15 }),
          },
        ],
      );
    });

    it('changes the counters before the track, so a refusal leaves the track as it was', async () => {
      members.changeCoins.mockRejectedValue(new ConflictException('мало'));

      await expect(service.update(id, patch(2), 'boss')).rejects.toThrow(
        'мало',
      );

      expect(model.findOneAndUpdate).not.toHaveBeenCalled();
      expect(crumbAudit.record).not.toHaveBeenCalled();
    });

    it('takes the crumbs back when the track could not be saved', async () => {
      model.findOneAndUpdate.mockRejectedValue(new Error('db down'));

      await expect(service.update(id, patch(15), 'boss')).rejects.toThrow(
        'db down',
      );

      expect(members.changeCoins).toHaveBeenLastCalledWith(
        'Аня',
        { season: SEASON.SPRING, year: 2027, delta: -5, actor: 'boss' },
        { guard: false },
      );
      expect(crumbAudit.record).not.toHaveBeenCalled();
    });

    it('leaves the counters and the audit alone when the coins stay', async () => {
      await service.update(id, patch(10), 'boss');

      expect(members.changeCoins).not.toHaveBeenCalled();
      expect(crumbAudit.record).not.toHaveBeenCalled();
      expect(model.findOneAndUpdate).toHaveBeenCalled();
    });

    it('answers 400 for a bad id and for an unknown track', async () => {
      await expect(service.update('nope', patch(1), 'boss')).rejects.toThrow(
        'Невірний id',
      );

      model.findById.mockResolvedValue(null as any);

      await expect(service.update(id, patch(1), 'boss')).rejects.toThrow(
        'Трек не існує',
      );
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      model.findById.mockResolvedValue(stored() as any);
      members.changeCoins.mockResolvedValue(changeOf());
      members.getAllRoles.mockReturnValue([]);
    });

    it('takes the coins of the track off the nickname, then removes the track', async () => {
      await service.delete(id, 'boss');

      expect(members.changeCoins).toHaveBeenCalledWith('Аня', {
        season: SEASON.SPRING,
        year: 2027,
        delta: -12,
        actor: 'boss',
      });
      expect(model.deleteOne).toHaveBeenCalledWith({ _id: id });
      expect(members.changeCoins.mock.invocationCallOrder[0]).toBeLessThan(
        model.deleteOne.mock.invocationCallOrder[0],
      );
    });

    it('audits what left the nickname, with the track as it was, the role by its label', async () => {
      members.getAllRoles.mockReturnValue([
        { value: MEMBER_ROLE.DUB, label: 'Дабер' },
      ]);

      await service.delete(id, 'boss');

      expect(crumbAudit.record).toHaveBeenCalledWith(
        AUDIT_KIND.TRACK_DELETED,
        'boss',
        'Видалено трек «Вітробой» еп. 3, Аня (Дабер), 12 крихт',
        [
          {
            change: changeOf(),
            entryId: id,
            before: {
              type: 'track',
              nickname: 'Аня',
              nameTitle: 'Вітробой',
              currentEpisode: 3,
              typeRole: MEMBER_ROLE.DUB,
              season: SEASON.SPRING,
              year: 2027,
              coins: 12,
            },
            after: null,
          },
        ],
      );
    });

    it('keeps the track when the nickname has not enough crumbs to give back', async () => {
      members.changeCoins.mockRejectedValue(new ConflictException('мало'));

      await expect(service.delete(id, 'boss')).rejects.toThrow('мало');

      expect(model.deleteOne).not.toHaveBeenCalled();
      expect(crumbAudit.record).not.toHaveBeenCalled();
    });

    it('gives the crumbs back when the track could not be removed', async () => {
      model.deleteOne.mockRejectedValue(new Error('db down') as never);

      await expect(service.delete(id, 'boss')).rejects.toThrow('db down');

      expect(members.changeCoins).toHaveBeenLastCalledWith(
        'Аня',
        { season: SEASON.SPRING, year: 2027, delta: 12, actor: 'boss' },
        { guard: false },
      );
      expect(crumbAudit.record).not.toHaveBeenCalled();
    });

    it('answers 400 for a bad id and for an unknown track', async () => {
      await expect(service.delete('nope', 'boss')).rejects.toThrow(
        'Невірний id',
      );

      model.findById.mockResolvedValue(null as any);

      await expect(service.delete(id, 'boss')).rejects.toThrow('Трек не існує');
    });
  });
});
