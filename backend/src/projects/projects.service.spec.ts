import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { vi } from 'vitest';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { ProposalsService } from '../proposals/proposals.service.js';
import { ANIME_TYPE, MEMBER_ROLE } from '../shared/index.js';
import type { CreateProjectData, UpdateProjectData } from './data/index.js';
import type { Project } from './interfaces/index.js';
import { ProjectsService } from './projects.service.js';

describe('ProjectsService', () => {
  const projectId = new Types.ObjectId();
  const proposalId = String(new Types.ObjectId());

  let service: ProjectsService;
  let projects: DeepMocked<Model<Project>>;
  let proposals: DeepMocked<ProposalsService>;

  const leanResult = (value: unknown) =>
    ({ lean: vi.fn().mockResolvedValue(value) }) as any;

  const project = (extra: Partial<Project> = {}): Project => ({
    _id: projectId,
    ukrName: 'Вітробой',
    romajiName: 'Wind Breaker',
    link: 'https://myanimelist.net/anime/54900',
    titleType: ANIME_TYPE.SERIES,
    isOngoing: true,
    isSequel: false,
    startDate: '2027-04-02',
    isFinished: false,
    isInTime: false,
    episodesReleased: 3,
    participants: [],
    ...extra,
  });

  const fields = (
    extra: Partial<CreateProjectData> = {},
  ): CreateProjectData => ({
    ukrName: 'Вітробой',
    romajiName: 'Wind Breaker',
    link: 'https://myanimelist.net/anime/54900',
    titleType: ANIME_TYPE.SERIES,
    isOngoing: true,
    isSequel: false,
    startDate: '2027-04-02',
    episodesReleased: 3,
    participants: [],
    ...extra,
  });

  const updateFields = (
    extra: Partial<UpdateProjectData> = {},
  ): UpdateProjectData => ({ ...fields(), ...extra });

  const existing = (value: Project | null) =>
    projects.findById.mockReturnValue(leanResult(value));

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-05-10T12:00:00Z'));

    const module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: 'PROJECT_MODEL',
          useValue: createMock<Model<Project>>(),
        },
        { provide: ProposalsService, useValue: createMock<ProposalsService>() },
      ],
    }).compile();

    service = module.get(ProjectsService);
    projects = module.get('PROJECT_MODEL');
    proposals = module.get(ProposalsService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('findAll', () => {
    it('lays the projects out by season, the current one flagged', async () => {
      projects.find.mockReturnValue(
        leanResult([project({ startDate: '2027-01-15' })]),
      );

      const { seasons } = await service.findAll();

      expect(
        seasons.map(({ season, isCurrent }) => [season, isCurrent]),
      ).toEqual([
        ['winter', false],
        ['spring', true],
      ]);
    });
  });

  describe('titles', () => {
    it('lists every project for a select: unfinished first, then the newest, with the season of the start', async () => {
      projects.find.mockReturnValue(
        leanResult([
          project({
            _id: new Types.ObjectId(),
            ukrName: 'Старий',
            startDate: '2026-11-02',
            isFinished: true,
            endDate: '2027-01-20',
          }),
          project({ ukrName: 'Давній', startDate: '2027-01-10' }),
          project({
            _id: new Types.ObjectId(),
            ukrName: 'Свіжий',
            codeName: 'fresh',
            startDate: '2027-04-02',
          }),
        ]),
      );

      const titles = await service.titles();

      expect(titles.map(({ ukrName }) => ukrName)).toEqual([
        'Свіжий',
        'Давній',
        'Старий',
      ]);
      expect(titles[0]).toEqual({
        _id: expect.any(String),
        ukrName: 'Свіжий',
        romajiName: 'Wind Breaker',
        codeName: 'fresh',
        titleType: ANIME_TYPE.SERIES,
        isOngoing: true,
        isFinished: false,
        startDate: '2027-04-02',
        season: 'spring',
        year: 2027,
      });
      expect(titles[1]).not.toHaveProperty('codeName');
      expect(titles[2]).toMatchObject({ season: 'fall', year: 2026 });
    });
  });

  describe('list', () => {
    it('gives every project once, with no layout by season', async () => {
      projects.find.mockReturnValue(
        leanResult([project({ startDate: '2027-01-15' })]),
      );

      const list = await service.list();

      expect(list).toHaveLength(1);
      expect(list[0].ukrName).toBe('Вітробой');
    });
  });

  describe('addParticipants', () => {
    const dub = MEMBER_ROLE.DUB;
    const sound = MEMBER_ROLE.SOUND;
    const person = (nickname: string, ...roles: MEMBER_ROLE[]) => ({
      nickname,
      roles,
    });
    const written = () =>
      projects.updateOne.mock.calls.map(([filter, update, options]) => ({
        filter,
        update,
        options,
      }));

    beforeEach(() => {
      projects.updateOne.mockResolvedValue({ matchedCount: 1 } as any);
    });

    it('adds the role to a nickname that is in the team already, in one write', async () => {
      existing(project({ participants: [person('Аня', dub)] }));

      await service.addParticipants(String(projectId), [
        { nickname: 'Аня', role: sound },
      ]);

      expect(written()).toEqual([
        {
          filter: { _id: projectId },
          update: {
            $addToSet: { 'participants.$[p0].roles': { $each: [sound] } },
          },
          options: { arrayFilters: [{ 'p0.nickname': 'Аня' }] },
        },
      ]);
    });

    it('writes nothing when everybody is in the team with the role already', async () => {
      existing(
        project({
          participants: [person('Аня', dub, sound), person('Борис', dub)],
        }),
      );

      await service.addParticipants(String(projectId), [
        { nickname: 'Аня', role: dub },
        { nickname: 'Аня', role: sound },
        { nickname: 'Борис', role: dub },
      ]);

      expect(projects.updateOne).not.toHaveBeenCalled();
    });

    it('finds a nickname that is in the team in another case and keeps the spelling the team has', async () => {
      existing(project({ participants: [person('Аня', dub)] }));

      await service.addParticipants(String(projectId), [
        { nickname: ' аня ', role: sound },
      ]);

      expect(written()).toHaveLength(1);
      expect(written()[0].options).toEqual({
        arrayFilters: [{ 'p0.nickname': 'Аня' }],
      });
      expect(written()[0].update).not.toHaveProperty('$push');
    });

    it('puts a new nickname into the team with its role, never past a full team', async () => {
      existing(project());

      await service.addParticipants(String(projectId), [
        { nickname: 'Борис', role: dub },
      ]);

      expect(written()).toEqual([
        {
          filter: {
            _id: projectId,
            'participants.nickname': { $nin: ['Борис'] },
          },
          update: {
            $push: {
              participants: {
                $each: [person('Борис', dub)],
                $slice: 50,
              },
            },
          },
          options: undefined,
        },
      ]);
    });

    it('joins the roles of one person from the tracks and spends two writes however many people there are', async () => {
      existing(project({ participants: [person('Аня', dub)] }));

      await service.addParticipants(String(projectId), [
        { nickname: 'Аня', role: sound },
        { nickname: 'Борис', role: dub },
        { nickname: 'борис', role: sound },
        { nickname: 'Віка', role: dub },
        { nickname: 'Аня', role: sound },
      ]);

      const [gain, join] = written();

      expect(written()).toHaveLength(2);
      expect(gain.update).toEqual({
        $addToSet: { 'participants.$[p0].roles': { $each: [sound] } },
      });
      expect(join.update).toEqual({
        $push: {
          participants: {
            $each: [person('Борис', dub, sound), person('Віка', dub)],
            $slice: 50,
          },
        },
      });
    });

    it('skips a blank nickname', async () => {
      existing(project());

      await service.addParticipants(String(projectId), [
        { nickname: '  ', role: dub },
      ]);

      expect(projects.updateOne).not.toHaveBeenCalled();
    });

    it('adds only as many new people as the team has room for, and says who was left out', async () => {
      const team = Array.from({ length: 49 }, (_, index) =>
        person(`Нік${index}`, dub),
      );
      existing(project({ participants: team }));
      const warn = vi
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);

      await service.addParticipants(String(projectId), [
        { nickname: 'Перший', role: dub },
        { nickname: 'Другий', role: dub },
        { nickname: 'Третій', role: dub },
      ]);

      expect(written()[0].update).toEqual({
        $push: {
          participants: { $each: [person('Перший', dub)], $slice: 50 },
        },
      });
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Другий, Третій'),
      );
    });

    it('adds nobody to a full team but still gives its people the new roles', async () => {
      const team = Array.from({ length: 50 }, (_, index) =>
        person(`Нік${index}`, dub),
      );
      existing(project({ participants: team }));
      vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

      await service.addParticipants(String(projectId), [
        { nickname: 'Нік3', role: sound },
        { nickname: 'Новачок', role: dub },
      ]);

      expect(written()).toHaveLength(1);
      expect(written()[0].update).toEqual({
        $addToSet: { 'participants.$[p0].roles': { $each: [sound] } },
      });
    });

    it('reads the team again and adds the role when somebody else put the same new person there first', async () => {
      projects.findById
        .mockReturnValueOnce(leanResult(project()))
        .mockReturnValueOnce(
          leanResult(project({ participants: [person('Аня', dub)] })),
        );
      projects.updateOne
        .mockResolvedValueOnce({ matchedCount: 0 } as any)
        .mockResolvedValueOnce({ matchedCount: 1 } as any);

      await service.addParticipants(String(projectId), [
        { nickname: 'Аня', role: sound },
      ]);

      expect(projects.findById).toHaveBeenCalledTimes(2);
      expect(written()[1]).toMatchObject({
        update: {
          $addToSet: { 'participants.$[p0].roles': { $each: [sound] } },
        },
        options: { arrayFilters: [{ 'p0.nickname': 'Аня' }] },
      });
    });

    it('gives up with 409 when the team keeps changing under it', async () => {
      existing(project());
      projects.updateOne.mockResolvedValue({ matchedCount: 0 } as any);

      await expect(
        service.addParticipants(String(projectId), [
          { nickname: 'Аня', role: dub },
        ]),
      ).rejects.toThrow(ConflictException);
      expect(projects.updateOne).toHaveBeenCalledTimes(3);
    });

    it('never takes anybody off', async () => {
      existing(project({ participants: [person('Аня', dub)] }));

      await service.addParticipants(String(projectId), [
        { nickname: 'Аня', role: sound },
        { nickname: 'Борис', role: dub },
      ]);

      const operators = written().flatMap(({ update }) =>
        Object.keys(update as object),
      );

      expect(operators).not.toContain('$pull');
      expect(operators).not.toContain('$set');
    });

    it('answers 404 for a project that does not exist', async () => {
      existing(null);

      await expect(
        service.addParticipants(String(projectId), [
          { nickname: 'Аня', role: dub },
        ]),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markEpisodeReleased', () => {
    it('raises the released episodes of a series to the episode of the track', async () => {
      await service.markEpisodeReleased(String(projectId), 5);

      expect(projects.updateOne).toHaveBeenCalledWith(
        {
          _id: String(projectId),
          titleType: ANIME_TYPE.SERIES,
          episodesReleased: { $lt: 5 },
        },
        { $set: { episodesReleased: 5 } },
      );
    });

    it('only ever raises the count, and leaves the films alone', async () => {
      await service.markEpisodeReleased(String(projectId), 2);

      const [filter, update] = projects.updateOne.mock.calls[0] as [
        { titleType: string; episodesReleased: { $lt: number } },
        object,
      ];

      expect(filter.episodesReleased).toEqual({ $lt: 2 });
      expect(filter.titleType).toBe(ANIME_TYPE.SERIES);
      expect(Object.keys(update)).toEqual(['$set']);
    });
  });

  describe('findOne', () => {
    it('answers the project', async () => {
      existing(project());

      await expect(service.findOne(String(projectId))).resolves.toMatchObject({
        ukrName: 'Вітробой',
      });
    });

    it('answers 404 for a project that does not exist', async () => {
      existing(null);

      await expect(service.findOne(String(projectId))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findName', () => {
    it('answers the Ukrainian name of the project', async () => {
      existing(project());

      await expect(service.findName(String(projectId))).resolves.toBe(
        'Вітробой',
      );
    });

    it('answers 404 for a project that does not exist', async () => {
      existing(null);

      await expect(service.findName(String(projectId))).rejects.toThrow(
        NotFoundException,
      );
    });

    it('answers 400 for an id that is not an ObjectId', async () => {
      await expect(service.findName('nope')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('create', () => {
    it('stores the project with trimmed nicknames and each role once', async () => {
      await service.create(
        fields({
          participants: [
            {
              nickname: ' Dixy ',
              roles: [MEMBER_ROLE.SUB, MEMBER_ROLE.SUB, MEMBER_ROLE.EDITOR],
            },
          ],
        }),
      );

      expect(projects.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ukrName: 'Вітробой',
          participants: [
            { nickname: 'Dixy', roles: [MEMBER_ROLE.SUB, MEMBER_ROLE.EDITOR] },
          ],
        }),
      );
    });

    it('drops blank optional fields instead of storing them', async () => {
      await service.create(
        fields({ codeName: '  ', posterUrl: null, funding: null }),
      );

      const [document] = projects.create.mock.calls[0] as unknown as [
        Record<string, unknown>,
      ];

      expect(document).not.toHaveProperty('codeName');
      expect(document).not.toHaveProperty('posterUrl');
      expect(document).not.toHaveProperty('funding');
    });

    it('keeps progress only for a series', async () => {
      await service.create(
        fields({ titleType: ANIME_TYPE.FILM, episodesReleased: 4 }),
      );

      expect(projects.create).toHaveBeenCalledWith(
        expect.objectContaining({ episodesReleased: 0 }),
      );
    });

    it('refuses a start date in the future', async () => {
      await expect(
        service.create(fields({ startDate: '2027-05-11' })),
      ).rejects.toThrow(BadRequestException);
      expect(projects.create).not.toHaveBeenCalled();
    });

    it('accepts today, counted in Kyiv time', async () => {
      vi.setSystemTime(new Date('2027-05-10T21:30:00Z'));

      await expect(
        service.create(fields({ startDate: '2027-05-11' })),
      ).resolves.not.toThrow();
    });

    it('claims the proposal before creating the project, under the same id', async () => {
      await service.create(fields({ proposalId }));

      const [claimedId] = proposals.markLaunched.mock.calls[0].slice(1);
      const [document] = projects.create.mock.calls[0] as unknown as [
        { _id: Types.ObjectId },
      ];

      expect(proposals.markLaunched).toHaveBeenCalledWith(
        proposalId,
        expect.any(Types.ObjectId),
      );
      expect(document._id).toBe(claimedId);
      expect(document).not.toHaveProperty('proposalId');
    });

    it('creates nothing when the proposal is already launched', async () => {
      proposals.markLaunched.mockRejectedValue(new ConflictException('taken'));

      await expect(service.create(fields({ proposalId }))).rejects.toThrow(
        ConflictException,
      );
      expect(projects.create).not.toHaveBeenCalled();
    });

    it('lets go of the proposal when the project could not be stored', async () => {
      projects.create.mockRejectedValue(new Error('db down') as never);

      await expect(service.create(fields({ proposalId }))).rejects.toThrow(
        'db down',
      );
      expect(proposals.clearLaunched).toHaveBeenCalledWith(
        expect.any(Types.ObjectId),
      );
    });

    it('stores a project that is already finished when it comes with an end date', async () => {
      await service.create(fields({ endDate: '2027-05-01', isInTime: true }));

      expect(projects.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isFinished: true,
          endDate: '2027-05-01',
          isInTime: true,
        }),
      );
    });

    it('stores a running project, with no end date at all, when none is given', async () => {
      await service.create(fields());

      const [document] = projects.create.mock.calls[0] as unknown as [
        Record<string, unknown>,
      ];

      expect(document).not.toHaveProperty('isFinished');
      expect(document).not.toHaveProperty('endDate');
      expect(document).not.toHaveProperty('isInTime');
    });

    it.each([
      ['before the start', '2027-04-01'],
      ['in the future', '2027-05-11'],
    ])('refuses an end date %s', async (_, endDate) => {
      await expect(
        service.create(fields({ endDate, proposalId })),
      ).rejects.toThrow(BadRequestException);
      expect(proposals.markLaunched).not.toHaveBeenCalled();
      expect(projects.create).not.toHaveBeenCalled();
    });

    it('refuses the in-time flag without an end date', async () => {
      await expect(service.create(fields({ isInTime: true }))).rejects.toThrow(
        BadRequestException,
      );
      expect(projects.create).not.toHaveBeenCalled();
    });

    it('does not touch proposals for a project made from scratch', async () => {
      await service.create(fields());

      expect(proposals.markLaunched).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('saves the fields of a running project and unsets the emptied optionals', async () => {
      existing(project());
      projects.findByIdAndUpdate.mockReturnValue(leanResult(project()));

      await service.update(
        String(projectId),
        updateFields({ posterUrl: null, codeName: 'wind' }),
      );

      const [, update] = projects.findByIdAndUpdate.mock.calls[0] as any;

      expect(update.$set).toMatchObject({ codeName: 'wind' });
      expect(update.$set).not.toHaveProperty('endDate');
      expect(update.$unset).toEqual({ posterUrl: '', funding: '' });
    });

    it('refuses an end date on a project that is still running', async () => {
      existing(project());

      await expect(
        service.update(
          String(projectId),
          updateFields({ endDate: '2027-05-01' }),
        ),
      ).rejects.toThrow(BadRequestException);
      expect(projects.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('keeps the end date and the in-time flag of a finished project editable', async () => {
      existing(project({ isFinished: true, endDate: '2027-04-20' }));
      projects.findByIdAndUpdate.mockReturnValue(leanResult(project()));

      await service.update(
        String(projectId),
        updateFields({ endDate: '2027-05-03', isInTime: true }),
      );

      const [, update] = projects.findByIdAndUpdate.mock.calls[0] as any;

      expect(update.$set).toMatchObject({
        endDate: '2027-05-03',
        isInTime: true,
      });
    });

    it('requires a finished project to keep an end date', async () => {
      existing(project({ isFinished: true, endDate: '2027-04-20' }));

      await expect(
        service.update(String(projectId), updateFields()),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses to move the start date past the end date', async () => {
      existing(project({ isFinished: true, endDate: '2027-04-20' }));

      await expect(
        service.update(
          String(projectId),
          updateFields({ startDate: '2027-05-01', endDate: '2027-04-20' }),
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('answers 404 for a project that does not exist', async () => {
      existing(null);

      await expect(
        service.update(String(projectId), updateFields()),
      ).rejects.toThrow(NotFoundException);
    });

    it('answers 400 for an id that is not an id', async () => {
      await expect(service.update('nope', updateFields())).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('finish', () => {
    it('marks the project finished with the date and the in-time flag', async () => {
      existing(project());

      await service.finish(String(projectId), {
        endDate: '2027-05-10',
        isInTime: true,
      });

      expect(projects.updateOne).toHaveBeenCalledWith(
        { _id: projectId },
        { $set: { isFinished: true, endDate: '2027-05-10', isInTime: true } },
      );
    });

    it('refuses a project that is already finished', async () => {
      existing(project({ isFinished: true, endDate: '2027-05-01' }));

      await expect(
        service.finish(String(projectId), {
          endDate: '2027-05-10',
          isInTime: false,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it.each([
      ['before the start', '2027-04-01'],
      ['in the future', '2027-05-11'],
    ])('refuses an end date %s', async (_, endDate) => {
      existing(project());

      await expect(
        service.finish(String(projectId), { endDate, isInTime: false }),
      ).rejects.toThrow(BadRequestException);
      expect(projects.updateOne).not.toHaveBeenCalled();
    });
  });

  describe('reopen', () => {
    it('clears the end date and the in-time flag', async () => {
      existing(project({ isFinished: true, endDate: '2027-05-01' }));

      await service.reopen(String(projectId));

      expect(projects.updateOne).toHaveBeenCalledWith(
        { _id: projectId },
        {
          $set: { isFinished: false, isInTime: false },
          $unset: { endDate: '' },
        },
      );
    });

    it('refuses a project that is still running', async () => {
      existing(project());

      await expect(service.reopen(String(projectId))).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove', () => {
    it('deletes the project and frees the proposal it came from', async () => {
      existing(project());

      await expect(service.remove(String(projectId))).resolves.toBe(true);

      expect(projects.deleteOne).toHaveBeenCalledWith({ _id: projectId });
      expect(proposals.clearLaunched).toHaveBeenCalledWith(projectId);
    });

    it('answers 404 for a project that does not exist', async () => {
      existing(null);

      await expect(service.remove(String(projectId))).rejects.toThrow(
        NotFoundException,
      );
      expect(projects.deleteOne).not.toHaveBeenCalled();
    });
  });
});
