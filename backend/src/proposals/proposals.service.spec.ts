import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { vi } from 'vitest';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { MEMBER_ROLE, SEASON } from '../shared/index.js';
import { PROPOSAL_FUNDING } from './enums/index.js';
import type { Proposal, ProposalSeason } from './interfaces/index.js';
import { ProposalsService } from './proposals.service.js';

describe('ProposalsService', () => {
  const seasonId = new Types.ObjectId();
  const proposalId = new Types.ObjectId();

  let service: ProposalsService;
  let seasons: DeepMocked<Model<ProposalSeason>>;
  let proposals: DeepMocked<Model<Proposal>>;

  const leanResult = (value: unknown) =>
    ({ lean: vi.fn().mockResolvedValue(value) }) as any;

  const season = (extra: Partial<ProposalSeason> = {}): ProposalSeason => ({
    _id: seasonId,
    season: SEASON.WINTER,
    year: 2027,
    isClosed: false,
    ...extra,
  });

  const proposal = (extra: Partial<Proposal> = {}): Proposal => ({
    _id: proposalId,
    seasonId,
    ukrName: 'Школа привидів',
    romajiName: 'Youkai Gakkou',
    link: 'https://myanimelist.net/anime/1',
    isOngoing: true,
    isSequel: false,
    participants: [],
    ...extra,
  });

  const inSeason = (value: ProposalSeason | null) =>
    seasons.findById.mockReturnValue(leanResult(value));
  const withProposal = (value: Proposal | null) =>
    proposals.findById.mockReturnValue(leanResult(value));

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProposalsService,
        {
          provide: 'PROPOSAL_SEASON_MODEL',
          useValue: createMock<Model<ProposalSeason>>(),
        },
        {
          provide: 'PROPOSAL_MODEL',
          useValue: createMock<Model<Proposal>>(),
        },
      ],
    }).compile();

    service = module.get(ProposalsService);
    seasons = module.get('PROPOSAL_SEASON_MODEL');
    proposals = module.get('PROPOSAL_MODEL');
  });

  describe('findAll', () => {
    it('lists seasons chronologically, each with its own proposals, and tells the cap', async () => {
      const fall2026 = season({
        _id: new Types.ObjectId(),
        season: SEASON.FALL,
        year: 2026,
      });
      const spring2027 = season({
        _id: new Types.ObjectId(),
        season: SEASON.SPRING,
      });
      const winter2027 = season();
      seasons.find.mockReturnValue(
        leanResult([spring2027, winter2027, fall2026]),
      );
      const inWinter = proposal();
      const inSpring = proposal({
        _id: new Types.ObjectId(),
        seasonId: spring2027._id,
      });
      proposals.find.mockReturnValue({
        sort: vi.fn().mockReturnValue(leanResult([inSpring, inWinter])),
      } as any);

      const result = await service.findAll();

      expect(result.maxPerPerson).toBe(3);
      expect(
        result.seasons.map(({ season, year }) => `${season} ${year}`),
      ).toEqual(['fall 2026', 'winter 2027', 'spring 2027']);
      expect(result.seasons.map((s) => s.proposals)).toEqual([
        [],
        [inWinter],
        [inSpring],
      ]);
    });
  });

  describe('createSeason', () => {
    it('refuses a season that already exists', async () => {
      seasons.exists.mockResolvedValue({ _id: seasonId } as any);

      await expect(
        service.createSeason({ season: SEASON.WINTER, year: 2027 }),
      ).rejects.toThrow(ConflictException);
      expect(seasons.create).not.toHaveBeenCalled();
    });

    it('creates an open season', async () => {
      seasons.exists.mockResolvedValue(null);

      await service.createSeason({ season: SEASON.SUMMER, year: 2027 });

      expect(seasons.create).toHaveBeenCalledWith({
        season: SEASON.SUMMER,
        year: 2027,
      });
    });
  });

  describe('closing and reopening', () => {
    it('sets the state and returns the season', async () => {
      const closed = season({ isClosed: true });
      seasons.findByIdAndUpdate.mockResolvedValue(closed as any);

      await expect(
        service.setSeasonClosed(String(seasonId), true),
      ).resolves.toBe(closed);
      expect(seasons.findByIdAndUpdate).toHaveBeenCalledWith(
        String(seasonId),
        { isClosed: true },
        { new: true },
      );
    });

    it('reports an unknown season', async () => {
      seasons.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        service.setSeasonClosed(String(seasonId), false),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects an id that is not an ObjectId without touching the database', async () => {
      await expect(service.setSeasonClosed('nope', true)).rejects.toThrow(
        'Невірний id',
      );
      expect(seasons.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('deleteSeason', () => {
    it('refuses to delete a season that is still open', async () => {
      inSeason(season({ isClosed: false }));

      await expect(service.deleteSeason(String(seasonId))).rejects.toThrow(
        'Спочатку закрийте сезон',
      );
      expect(proposals.deleteMany).not.toHaveBeenCalled();
      expect(seasons.deleteOne).not.toHaveBeenCalled();
    });

    it('deletes a closed season together with all its proposals', async () => {
      inSeason(season({ isClosed: true }));

      await expect(service.deleteSeason(String(seasonId))).resolves.toBe(true);

      expect(proposals.deleteMany).toHaveBeenCalledWith({ seasonId });
      expect(seasons.deleteOne).toHaveBeenCalledWith({ _id: seasonId });
    });

    it('reports an unknown season', async () => {
      inSeason(null);

      await expect(service.deleteSeason(String(seasonId))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createProposal', () => {
    const dto = {
      seasonId: String(seasonId),
      ukrName: 'Школа привидів',
      romajiName: 'Youkai Gakkou',
      link: 'https://myanimelist.net/anime/1',
      isOngoing: true,
      isSequel: false,
    };

    it('refuses to add to a closed season', async () => {
      inSeason(season({ isClosed: true }));

      await expect(service.createProposal(dto)).rejects.toThrow(
        'Сезон закрито',
      );
      expect(proposals.create).not.toHaveBeenCalled();
    });

    it('refuses a second proposal with the same name in the season', async () => {
      inSeason(season());
      proposals.exists.mockResolvedValue({ _id: proposalId } as any);

      await expect(service.createProposal(dto)).rejects.toThrow(
        ConflictException,
      );
      expect(proposals.exists).toHaveBeenCalledWith({
        seasonId,
        ukrName: 'Школа привидів',
      });
      expect(proposals.create).not.toHaveBeenCalled();
    });

    it('stores only the optional fields that have a value', async () => {
      inSeason(season());
      proposals.exists.mockResolvedValue(null);

      await service.createProposal({
        ...dto,
        posterUrl: null,
        note: '  ',
        funding: PROPOSAL_FUNDING.PATRON,
      });

      expect(proposals.create).toHaveBeenCalledWith({
        ukrName: 'Школа привидів',
        romajiName: 'Youkai Gakkou',
        link: 'https://myanimelist.net/anime/1',
        isOngoing: true,
        isSequel: false,
        seasonId,
        funding: PROPOSAL_FUNDING.PATRON,
      });
    });
  });

  describe('updateProposal', () => {
    const dto = {
      ukrName: 'Школа привидів',
      romajiName: 'Youkai Gakkou',
      link: 'https://myanimelist.net/anime/1',
      isOngoing: true,
      isSequel: true,
    };

    beforeEach(() => {
      withProposal(proposal());
      proposals.exists.mockResolvedValue(null);
      proposals.findByIdAndUpdate.mockReturnValue(leanResult({}));
    });

    it('clears optional fields that were left empty', async () => {
      await service.updateProposal(String(proposalId), {
        ...dto,
        posterUrl: null,
        note: '',
      });

      expect(proposals.findByIdAndUpdate).toHaveBeenCalledWith(
        proposalId,
        {
          $set: { ...dto, seasonId },
          $unset: { posterUrl: '', note: '', funding: '' },
        },
        { new: true },
      );
    });

    it('moves the proposal to another open season, participants included', async () => {
      const target = season({ _id: new Types.ObjectId() });
      inSeason(target);

      await service.updateProposal(String(proposalId), {
        ...dto,
        seasonId: String(target._id),
        funding: PROPOSAL_FUNDING.ORDER,
      });

      expect(proposals.findByIdAndUpdate).toHaveBeenCalledWith(
        proposalId,
        expect.objectContaining({
          $set: expect.objectContaining({ seasonId: target._id }),
        }),
        { new: true },
      );
    });

    it('refuses to move into a closed season', async () => {
      inSeason(season({ _id: new Types.ObjectId(), isClosed: true }));

      await expect(
        service.updateProposal(String(proposalId), {
          ...dto,
          seasonId: String(new Types.ObjectId()),
        }),
      ).rejects.toThrow('Сезон закрито');
      expect(proposals.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('refuses a name that another proposal of the target season already has', async () => {
      proposals.exists.mockResolvedValue({ _id: new Types.ObjectId() } as any);

      await expect(
        service.updateProposal(String(proposalId), dto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('setParticipation', () => {
    beforeEach(() => {
      inSeason(season());
      proposals.updateOne.mockResolvedValue({} as any);
    });

    it('refuses everything in a closed season', async () => {
      withProposal(proposal());
      inSeason(season({ isClosed: true }));

      await expect(
        service.setParticipation('ghost', String(proposalId), [
          MEMBER_ROLE.SUB,
        ]),
      ).rejects.toThrow('Сезон закрито');
      expect(proposals.updateOne).not.toHaveBeenCalled();
    });

    it('lets a person join with several roles, once each', async () => {
      withProposal(proposal());
      proposals.countDocuments
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3);

      await service.setParticipation('ghost', String(proposalId), [
        MEMBER_ROLE.SUB,
        MEMBER_ROLE.EDITOR,
        MEMBER_ROLE.SUB,
      ]);

      expect(proposals.updateOne).toHaveBeenCalledWith(
        { _id: proposalId, 'participants.userName': { $ne: 'ghost' } },
        {
          $push: {
            participants: {
              userName: 'ghost',
              roles: [MEMBER_ROLE.SUB, MEMBER_ROLE.EDITOR],
            },
          },
        },
      );
    });

    it('counts titles per season for the cap', async () => {
      withProposal(proposal());
      proposals.countDocuments.mockResolvedValue(0);

      await service.setParticipation('ghost', String(proposalId), [
        MEMBER_ROLE.DUB,
      ]);

      expect(proposals.countDocuments).toHaveBeenCalledWith({
        seasonId,
        'participants.userName': 'ghost',
      });
    });

    it('refuses a fourth title in the season', async () => {
      withProposal(proposal());
      proposals.countDocuments.mockResolvedValue(3);

      await expect(
        service.setParticipation('ghost', String(proposalId), [
          MEMBER_ROLE.DUB,
        ]),
      ).rejects.toThrow('максимум до 3 проєктів');
      expect(proposals.updateOne).not.toHaveBeenCalled();
    });

    it('takes a join back when a parallel request pushed the person over the cap', async () => {
      withProposal(proposal());
      proposals.countDocuments
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(4);

      await expect(
        service.setParticipation('ghost', String(proposalId), [
          MEMBER_ROLE.DUB,
        ]),
      ).rejects.toThrow(ConflictException);

      expect(proposals.updateOne).toHaveBeenLastCalledWith(
        { _id: proposalId },
        { $pull: { participants: { userName: 'ghost' } } },
      );
    });

    it('lets a person take only the free slots when several joins arrive at once', async () => {
      const first = proposal({ _id: new Types.ObjectId() });
      const second = proposal({ _id: new Types.ObjectId() });
      let joined = 2;

      proposals.findById.mockImplementation((id: unknown) =>
        leanResult(String(id) === String(first._id) ? first : second),
      );
      proposals.countDocuments.mockImplementation((async () => joined) as any);
      proposals.updateOne.mockImplementation((async (
        _filter: unknown,
        update: any,
      ) => {
        if (update.$push) {
          await new Promise((resolve) => setTimeout(resolve, 5));
          joined++;
        }
      }) as any);

      const results = await Promise.allSettled([
        service.setParticipation('ghost', String(first._id), [MEMBER_ROLE.SUB]),
        service.setParticipation('ghost', String(second._id), [
          MEMBER_ROLE.SUB,
        ]),
      ]);

      expect(results.map((result) => result.status)).toEqual([
        'fulfilled',
        'rejected',
      ]);
      expect(joined).toBe(3);
    });

    it('does not let one person block another', async () => {
      withProposal(proposal());
      proposals.countDocuments.mockResolvedValue(0);

      const results = await Promise.all([
        service.setParticipation('ghost', String(proposalId), [
          MEMBER_ROLE.SUB,
        ]),
        service.setParticipation('other', String(proposalId), [
          MEMBER_ROLE.SUB,
        ]),
      ]);

      expect(results).toHaveLength(2);
    });

    it('keeps working after a join was refused', async () => {
      withProposal(proposal());
      proposals.countDocuments.mockResolvedValueOnce(3);

      await expect(
        service.setParticipation('ghost', String(proposalId), [
          MEMBER_ROLE.SUB,
        ]),
      ).rejects.toThrow(ConflictException);

      proposals.countDocuments.mockResolvedValue(0);

      await expect(
        service.setParticipation('ghost', String(proposalId), [
          MEMBER_ROLE.SUB,
        ]),
      ).resolves.toBeDefined();
    });

    it('changes the roles of someone who already joined without checking the cap', async () => {
      withProposal(
        proposal({
          participants: [{ userName: 'ghost', roles: [MEMBER_ROLE.SUB] }],
        }),
      );

      await service.setParticipation('ghost', String(proposalId), [
        MEMBER_ROLE.SOUND,
      ]);

      expect(proposals.updateOne).toHaveBeenCalledWith(
        { _id: proposalId, 'participants.userName': 'ghost' },
        { $set: { 'participants.$.roles': [MEMBER_ROLE.SOUND] } },
      );
      expect(proposals.countDocuments).not.toHaveBeenCalled();
    });

    it('withdraws the person when no role is left', async () => {
      withProposal(
        proposal({
          participants: [{ userName: 'ghost', roles: [MEMBER_ROLE.SUB] }],
        }),
      );

      await service.setParticipation('ghost', String(proposalId), []);

      expect(proposals.updateOne).toHaveBeenCalledWith(
        { _id: proposalId },
        { $pull: { participants: { userName: 'ghost' } } },
      );
    });
  });

  describe('setParticipantRoles (admin)', () => {
    const joined = proposal({
      participants: [{ userName: 'ghost', roles: [MEMBER_ROLE.SUB] }],
    });

    beforeEach(() => {
      proposals.updateOne.mockResolvedValue({} as any);
    });

    it('works in a closed season too, since it never looks at the season', async () => {
      withProposal(joined);

      await service.setParticipantRoles(String(proposalId), 'ghost', [
        MEMBER_ROLE.EDITOR,
      ]);

      expect(proposals.updateOne).toHaveBeenCalledWith(
        { _id: proposalId, 'participants.userName': 'ghost' },
        { $set: { 'participants.$.roles': [MEMBER_ROLE.EDITOR] } },
      );
      expect(seasons.findById).not.toHaveBeenCalled();
    });

    it('removes a participant when given no roles', async () => {
      withProposal(joined);

      await service.setParticipantRoles(String(proposalId), 'ghost', []);

      expect(proposals.updateOne).toHaveBeenCalledWith(
        { _id: proposalId },
        { $pull: { participants: { userName: 'ghost' } } },
      );
    });

    it('does not create a paw for somebody who has not joined', async () => {
      withProposal(joined);

      await expect(
        service.setParticipantRoles(String(proposalId), 'stranger', [
          MEMBER_ROLE.SUB,
        ]),
      ).rejects.toThrow('Учасника не знайдено');
      expect(proposals.updateOne).not.toHaveBeenCalled();
    });
  });

  describe('deleteParticipationsByUser', () => {
    it('removes the person from open seasons only', async () => {
      const open = new Types.ObjectId();
      seasons.find.mockReturnValue(leanResult([{ _id: open }]));

      await service.deleteParticipationsByUser('ghost');

      expect(seasons.find).toHaveBeenCalledWith(
        { isClosed: false },
        { _id: 1 },
      );
      expect(proposals.updateMany).toHaveBeenCalledWith(
        { seasonId: { $in: [open] }, 'participants.userName': 'ghost' },
        { $pull: { participants: { userName: 'ghost' } } },
      );
    });
  });
});
