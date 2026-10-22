import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { vi } from 'vitest';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { todayInKyiv } from '../projects/layout.js';
import { ProjectsService } from '../projects/projects.service.js';
import { SEASON } from '../shared/index.js';
import { TrackService } from '../tracks/tracks.service.js';
import { BudgetAuditService } from './budget-audit.service.js';
import { BudgetService } from './budget.service.js';
import {
  AUDIT_KIND,
  BUDGET_ERROR,
  ENTRY_TYPE,
  INCOME_SOURCE,
  SIDE_KIND,
} from './enums/index.js';
import type { BudgetEntry } from './interfaces/index.js';

describe('BudgetService', () => {
  const entryId = new Types.ObjectId();

  let service: BudgetService;
  let entries: DeepMocked<Model<BudgetEntry>>;
  let audit: DeepMocked<BudgetAuditService>;
  let tracks: DeepMocked<TrackService>;
  let projects: DeepMocked<ProjectsService>;

  const leanResult = (value: unknown) =>
    ({ lean: vi.fn().mockResolvedValue(value) }) as any;

  const entry = (extra: Partial<BudgetEntry> = {}): BudgetEntry => ({
    _id: entryId,
    type: ENTRY_TYPE.INCOME,
    source: INCOME_SOURCE.TEAM_JAR,
    amountKop: 100000,
    date: '2027-05-10',
    season: SEASON.SPRING,
    year: 2027,
    createdBy: 'root',
    ...extra,
  });

  const period = {
    date: '2027-05-10',
    season: SEASON.SPRING,
    year: 2027,
  };

  const stored = (list: BudgetEntry[]) =>
    entries.aggregate.mockResolvedValue(
      list.map(
        ({ source, amountKop, season, year, projectId, title, nickname }) => ({
          _id: { source, amountKop, season, year, projectId, title, nickname },
          count: 1,
        }),
      ) as any,
    );

  const existing = (value: BudgetEntry | null) =>
    entries.findById.mockReturnValue(leanResult(value));

  const rowsWritten = () =>
    (audit.save.mock.calls[0][0] as any[]).map(
      ({ subjectKey, deltaKop, balanceAfterKop }) => [
        subjectKey,
        deltaKop,
        balanceAfterKop,
      ],
    );

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-05-10T12:00:00Z'));

    const module = await Test.createTestingModule({
      providers: [
        BudgetService,
        {
          provide: 'BUDGET_ENTRY_MODEL',
          useValue: createMock<Model<BudgetEntry>>(),
        },
        {
          provide: BudgetAuditService,
          useValue: createMock<BudgetAuditService>(),
        },
        { provide: TrackService, useValue: createMock<TrackService>() },
        { provide: ProjectsService, useValue: createMock<ProjectsService>() },
      ],
    }).compile();

    service = module.get(BudgetService);
    entries = module.get('BUDGET_ENTRY_MODEL');
    audit = module.get(BudgetAuditService);
    tracks = module.get(TrackService);
    projects = module.get(ProjectsService);

    audit.operation.mockImplementation((kind, actor, operationDescription) => ({
      operationId: 'op-1',
      at: new Date(),
      day: todayInKyiv(),
      kind,
      actor,
      operationDescription,
    }));

    stored([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getSummary', () => {
    it('sums the journal and divides the jar by the crumbs the team earned', async () => {
      stored([entry({ amountKop: 100000 })]);
      tracks.getCoinsBySeason.mockResolvedValue([
        { season: SEASON.SPRING, year: 2027, coins: 500 },
      ]);

      const { today, seasons, confectioneryKop } = await service.getSummary();

      expect(today).toBe('2027-05-10');
      expect(confectioneryKop).toBe(100000);
      expect(seasons[1]).toMatchObject({
        season: SEASON.SPRING,
        isCurrent: true,
        jarKop: 100000,
        crumbs: 500,
        coefficient: 2,
      });
    });

    it('asks the database for counts of equal entries, not for every record', async () => {
      entries.aggregate.mockResolvedValue([
        {
          _id: {
            source: INCOME_SOURCE.TEAM_JAR,
            amountKop: 5000,
            season: SEASON.SPRING,
            year: 2027,
          },
          count: 3,
        },
        {
          _id: {
            source: INCOME_SOURCE.ORDER,
            amountKop: 10000,
            season: SEASON.SPRING,
            year: 2027,
            title: 'Т',
          },
          count: 2,
        },
      ] as any);
      tracks.getCoinsBySeason.mockResolvedValue([]);

      const { confectioneryKop, ordersKop, seasons } =
        await service.getSummary();

      expect(confectioneryKop).toBe(35000);
      expect(ordersKop).toBe(18000);
      expect(seasons[1].jarKop).toBe(17000);
      expect(entries.find).not.toHaveBeenCalled();

      const [{ $group }] = entries.aggregate.mock.calls[0][0] as any[];

      expect(Object.keys($group._id)).toEqual([
        'source',
        'amountKop',
        'season',
        'year',
        'projectId',
        'title',
        'nickname',
      ]);
    });
  });

  describe('findEntries', () => {
    const chain = (list: BudgetEntry[]) => {
      const skip = vi.fn();
      const limit = vi.fn();
      const lean = vi.fn().mockResolvedValue(list);
      const sort = vi.fn().mockReturnValue({ skip });

      skip.mockReturnValue({ limit });
      limit.mockReturnValue({ lean });
      entries.find.mockReturnValue({ sort } as any);
      entries.countDocuments.mockResolvedValue(41 as any);

      return { skip, limit, sort };
    };

    it('pages the journal, newest first', async () => {
      const { skip, limit } = chain([entry()]);

      const result = await service.findEntries({ page: 3, perPage: 10 });

      expect(entries.find).toHaveBeenCalledWith({});
      expect(skip).toHaveBeenCalledWith(20);
      expect(limit).toHaveBeenCalledWith(10);
      expect(result).toMatchObject({ page: 3, perPage: 10, total: 41 });
    });

    it('breaks a tie of date and time by id, so a page never repeats or skips a record', async () => {
      const { sort } = chain([]);

      await service.findEntries({ page: 1, perPage: 10 });

      expect(sort).toHaveBeenCalledWith({ date: -1, createdAt: -1, _id: -1 });
    });

    it('filters by one season', async () => {
      chain([]);

      await service.findEntries({
        page: 1,
        perPage: 25,
        season: SEASON.WINTER,
        year: 2027,
      });

      expect(entries.find).toHaveBeenCalledWith({
        season: SEASON.WINTER,
        year: 2027,
      });
      expect(entries.countDocuments).toHaveBeenCalledWith({
        season: SEASON.WINTER,
        year: 2027,
      });
    });
  });

  describe('createIncomes', () => {
    it('writes every line with the shared date and season, and the admin who added it', async () => {
      const created = await service.createIncomes(
        {
          ...period,
          lines: [
            { source: INCOME_SOURCE.TEAM_JAR, amountKop: 100000 },
            { source: INCOME_SOURCE.BMAC, amountKop: 5000 },
          ],
        },
        'root',
      );

      expect(created).toHaveLength(2);
      expect(entries.insertMany).toHaveBeenCalledWith([
        expect.objectContaining({
          source: INCOME_SOURCE.TEAM_JAR,
          amountKop: 100000,
          ...period,
          createdBy: 'root',
        }),
        expect.objectContaining({
          source: INCOME_SOURCE.BMAC,
          amountKop: 5000,
        }),
      ]);
    });

    it('audits the jar with a running balance across the lines of one operation', async () => {
      stored([entry({ amountKop: 20000 })]);

      await service.createIncomes(
        {
          ...period,
          lines: [
            { source: INCOME_SOURCE.TEAM_JAR, amountKop: 100000 },
            { source: INCOME_SOURCE.BMAC, amountKop: 5000 },
          ],
        },
        'root',
      );

      expect(rowsWritten()).toEqual([
        ['jar:2027-spring', 100000, 120000],
        ['jar:2027-spring', 5000, 125000],
      ]);

      const rows = audit.save.mock.calls[0][0];

      expect(new Set(rows.map(({ operationId }) => operationId)).size).toBe(1);
      expect(rows[0]).toMatchObject({
        kind: AUDIT_KIND.INCOME_CREATED,
        actor: 'root',
        subjectKind: SIDE_KIND.JAR,
        subjectLabel: 'Банка Весна 2027',
        day: '2027-05-10',
        before: null,
        after: expect.objectContaining({ amountKop: 100000 }),
      });
    });

    it('audits an order as a tenth in the jar and the rest in the budget of its title', async () => {
      await service.createIncomes(
        {
          ...period,
          lines: [
            {
              source: INCOME_SOURCE.ORDER,
              amountKop: 10000,
              title: ' Вітробой ',
            },
          ],
        },
        'root',
      );

      expect(rowsWritten()).toEqual([
        ['jar:2027-spring', 1000, 1000],
        ['orders:title:вітробой', 9000, 9000],
      ]);
    });

    it('takes the name of a chosen project from the project, not from the form', async () => {
      projects.findName.mockResolvedValue('Вітробой');

      await service.createIncomes(
        {
          ...period,
          lines: [
            {
              source: INCOME_SOURCE.PROJECT_JAR,
              amountKop: 30000,
              projectId: 'p1',
              title: 'що завгодно',
            },
          ],
        },
        'root',
      );

      expect(projects.findName).toHaveBeenCalledWith('p1');
      expect(entries.insertMany).toHaveBeenCalledWith([
        expect.objectContaining({ projectId: 'p1', title: 'Вітробой' }),
      ]);
    });

    it('looks up every chosen project once, however many lines use it', async () => {
      projects.findName.mockImplementation(async (id: string) =>
        id === 'p1' ? 'Вітробой' : 'Ґвендолін',
      );

      await service.createIncomes(
        {
          ...period,
          lines: [
            { source: INCOME_SOURCE.ORDER, amountKop: 10000, projectId: 'p1' },
            {
              source: INCOME_SOURCE.PROJECT_JAR,
              amountKop: 20000,
              projectId: 'p1',
            },
            { source: INCOME_SOURCE.ORDER, amountKop: 30000, projectId: 'p2' },
          ],
        },
        'root',
      );

      expect(projects.findName).toHaveBeenCalledTimes(2);
      expect(entries.insertMany).toHaveBeenCalledWith([
        expect.objectContaining({ projectId: 'p1', title: 'Вітробой' }),
        expect.objectContaining({ projectId: 'p1', title: 'Вітробой' }),
        expect.objectContaining({ projectId: 'p2', title: 'Ґвендолін' }),
      ]);
    });

    it('refuses a project that does not exist and writes nothing', async () => {
      projects.findName.mockRejectedValue(
        new NotFoundException('Проєкт не знайдено'),
      );

      await expect(
        service.createIncomes(
          {
            ...period,
            lines: [
              {
                source: INCOME_SOURCE.ORDER,
                amountKop: 10000,
                projectId: 'gone',
              },
            ],
          },
          'root',
        ),
      ).rejects.toThrow(NotFoundException);

      expect(entries.insertMany).not.toHaveBeenCalled();
      expect(audit.save).not.toHaveBeenCalled();
    });

    it('builds the running balance from entries the database counted together', async () => {
      entries.aggregate.mockResolvedValue([
        {
          _id: {
            source: INCOME_SOURCE.TEAM_JAR,
            amountKop: 20000,
            season: SEASON.SPRING,
            year: 2027,
          },
          count: 3,
        },
      ] as any);

      await service.createIncomes(
        {
          ...period,
          lines: [{ source: INCOME_SOURCE.BMAC, amountKop: 5000 }],
        },
        'root',
      );

      expect(rowsWritten()).toEqual([['jar:2027-spring', 5000, 65000]]);
    });

    it('keeps a title only on orders and project jars, and a nickname only on a lisodar', async () => {
      await service.createIncomes(
        {
          ...period,
          lines: [
            {
              source: INCOME_SOURCE.TEAM_JAR,
              amountKop: 100,
              title: 'Т',
              projectId: 'p1',
              nickname: 'Аня',
            },
            {
              source: INCOME_SOURCE.LISODAR,
              amountKop: 100,
              title: 'Т',
              nickname: 'Аня',
            },
          ],
        },
        'root',
      );

      const [team, lisodar] = entries.insertMany.mock.calls[0][0] as any[];

      expect(team).not.toHaveProperty('title');
      expect(team).not.toHaveProperty('projectId');
      expect(team).not.toHaveProperty('nickname');
      expect(lisodar).not.toHaveProperty('title');
      expect(lisodar).toHaveProperty('nickname', 'Аня');
      expect(projects.findName).not.toHaveBeenCalled();
    });

    it('refuses a date in the future and writes nothing', async () => {
      await expect(
        service.createIncomes(
          {
            ...period,
            date: '2027-05-11',
            lines: [{ source: INCOME_SOURCE.TEAM_JAR, amountKop: 100 }],
          },
          'root',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(entries.insertMany).not.toHaveBeenCalled();
      expect(audit.save).not.toHaveBeenCalled();
    });

    it('lets the failure of the audit through and keeps the saved record', async () => {
      audit.save.mockRejectedValue(
        new InternalServerErrorException(
          'Операцію виконано, але запис в аудит не збережено',
          BUDGET_ERROR.AUDIT_NOT_SAVED,
        ),
      );

      await expect(
        service.createIncomes(
          {
            ...period,
            lines: [{ source: INCOME_SOURCE.TEAM_JAR, amountKop: 100 }],
          },
          'root',
        ),
      ).rejects.toMatchObject({
        response: { error: BUDGET_ERROR.AUDIT_NOT_SAVED, statusCode: 500 },
      });

      expect(entries.insertMany).toHaveBeenCalled();
    });
  });

  describe('updateEntry', () => {
    const patch = (extra: Record<string, unknown> = {}) => ({
      ...period,
      source: INCOME_SOURCE.TEAM_JAR,
      amountKop: 150000,
      ...extra,
    });

    beforeEach(() => {
      existing(entry());
      stored([entry()]);
      entries.findByIdAndUpdate.mockReturnValue(
        leanResult(entry({ amountKop: 150000 })),
      );
    });

    it('audits only what changed, from before to after', async () => {
      await service.updateEntry(String(entryId), patch(), 'boss');

      expect(rowsWritten()).toEqual([['jar:2027-spring', 50000, 150000]]);
      expect(audit.save.mock.calls[0][0][0]).toMatchObject({
        kind: AUDIT_KIND.INCOME_UPDATED,
        actor: 'boss',
        before: expect.objectContaining({ amountKop: 100000 }),
        after: expect.objectContaining({ amountKop: 150000 }),
      });
    });

    it('records who changed it and removes the optional fields it no longer has', async () => {
      await service.updateEntry(String(entryId), patch(), 'boss');

      expect(entries.findByIdAndUpdate).toHaveBeenCalledWith(
        entryId,
        {
          $set: expect.objectContaining({
            amountKop: 150000,
            updatedBy: 'boss',
          }),
          $unset: { projectId: '', title: '', nickname: '' },
        },
        { new: true },
      );
    });

    it('does not send an empty $unset when every optional field stays', async () => {
      existing(entry({ source: INCOME_SOURCE.LISODAR, nickname: 'Аня' }));

      await service.updateEntry(
        String(entryId),
        patch({ source: INCOME_SOURCE.LISODAR, nickname: 'Аня' }),
        'boss',
      );

      const update = entries.findByIdAndUpdate.mock.calls[0][1] as any;

      expect(update.$unset).toEqual({ projectId: '', title: '' });
    });

    it('audits a move to another season as the old jar losing and the new one gaining', async () => {
      entries.findByIdAndUpdate.mockReturnValue(
        leanResult(entry({ season: SEASON.SUMMER })),
      );

      await service.updateEntry(
        String(entryId),
        patch({ season: SEASON.SUMMER, amountKop: 100000 }),
        'boss',
      );

      expect(rowsWritten()).toEqual([
        ['jar:2027-spring', -100000, 0],
        ['jar:2027-summer', 100000, 100000],
      ]);
    });

    describe('when the project of the record is gone', () => {
      const order = (extra: Partial<BudgetEntry> = {}) =>
        entry({
          source: INCOME_SOURCE.ORDER,
          projectId: 'p1',
          title: 'Вітробой',
          ...extra,
        });

      beforeEach(() => {
        existing(order());
        entries.findByIdAndUpdate.mockReturnValue(
          leanResult(order({ amountKop: 150000 })),
        );
        projects.findName.mockRejectedValue(
          new NotFoundException('Проєкт не знайдено'),
        );
      });

      it('keeps the name the record already has and lets it be corrected', async () => {
        await service.updateEntry(
          String(entryId),
          patch({
            source: INCOME_SOURCE.ORDER,
            projectId: 'p1',
            title: 'інше',
          }),
          'boss',
        );

        const update = entries.findByIdAndUpdate.mock.calls[0][1] as any;

        expect(update.$set).toMatchObject({
          projectId: 'p1',
          title: 'Вітробой',
          amountKop: 150000,
        });
      });

      it('still refuses a different project that does not exist', async () => {
        await expect(
          service.updateEntry(
            String(entryId),
            patch({ source: INCOME_SOURCE.ORDER, projectId: 'p9' }),
            'boss',
          ),
        ).rejects.toThrow(NotFoundException);

        expect(entries.findByIdAndUpdate).not.toHaveBeenCalled();
      });
    });

    it('answers 404 for an unknown record and 400 for a bad id', async () => {
      existing(null);

      await expect(
        service.updateEntry(String(entryId), patch(), 'boss'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateEntry('nope', patch(), 'boss'),
      ).rejects.toThrow(BadRequestException);
      expect(entries.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('refuses a date in the future', async () => {
      await expect(
        service.updateEntry(
          String(entryId),
          patch({ date: '2027-06-01' }),
          'boss',
        ),
      ).rejects.toThrow(BadRequestException);

      expect(entries.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('deleteEntry', () => {
    it('removes the record and audits what left each side', async () => {
      existing(entry());
      stored([entry()]);

      await expect(service.deleteEntry(String(entryId), 'boss')).resolves.toBe(
        true,
      );

      expect(entries.deleteOne).toHaveBeenCalledWith({ _id: entryId });
      expect(rowsWritten()).toEqual([['jar:2027-spring', -100000, 0]]);
      expect(audit.save.mock.calls[0][0][0]).toMatchObject({
        kind: AUDIT_KIND.INCOME_DELETED,
        actor: 'boss',
        before: expect.objectContaining({ amountKop: 100000 }),
        after: null,
      });
    });

    it('answers 404 for an unknown record without deleting', async () => {
      existing(null);

      await expect(
        service.deleteEntry(String(entryId), 'boss'),
      ).rejects.toThrow(NotFoundException);
      expect(entries.deleteOne).not.toHaveBeenCalled();
    });
  });
});
