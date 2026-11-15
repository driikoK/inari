import {
  BadRequestException,
  ConflictException,
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
import { created } from './calc.js';
import { BudgetService } from './budget.service.js';
import {
  AUDIT_KIND,
  BUDGET_ERROR,
  ENTRY_TYPE,
  EXPENSE_KIND,
  EXPENSE_SECTION,
  INCOME_SOURCE,
  SIDE_KIND,
  SUPPORT_DIRECTION,
} from './enums/index.js';
import type {
  AllocationEntry,
  BudgetEntry,
  ExpenseEntry,
  IncomeEntry,
} from './interfaces/index.js';

describe('BudgetService', () => {
  const entryId = new Types.ObjectId();

  let service: BudgetService;
  let entries: DeepMocked<Model<BudgetEntry>>;
  let audit: DeepMocked<BudgetAuditService>;
  let tracks: DeepMocked<TrackService>;
  let projects: DeepMocked<ProjectsService>;

  const leanResult = (value: unknown) =>
    ({ lean: vi.fn().mockResolvedValue(value) }) as any;

  const entry = (extra: Partial<IncomeEntry> = {}): IncomeEntry => ({
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

  const stored = (list: IncomeEntry[]) =>
    entries.aggregate.mockResolvedValue(
      list.map(
        ({
          type,
          source,
          amountKop,
          season,
          year,
          projectId,
          title,
          nickname,
        }) => ({
          _id: {
            type,
            source,
            amountKop,
            season,
            year,
            projectId,
            title,
            nickname,
          },
          count: 1,
          lastDate: '2027-05-10',
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
        'type',
        'source',
        'kind',
        'section',
        'direction',
        'amountKop',
        'season',
        'year',
        'projectId',
        'title',
        'nickname',
        'crumbSeason',
        'crumbYear',
      ]);
      expect($group.lastDate).toEqual({ $max: '$date' });
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

    it('counts a record with no type as an income, in the filter and in what it returns', async () => {
      const { type, ...legacy } = entry();

      chain([legacy as IncomeEntry]);

      const result = await service.findEntries({
        page: 1,
        perPage: 10,
        type: ENTRY_TYPE.INCOME,
      });

      expect(entries.find).toHaveBeenCalledWith({
        type: { $in: [ENTRY_TYPE.INCOME, null] },
      });
      expect(result.data[0].type).toBe(ENTRY_TYPE.INCOME);
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

    it('stamps each jar row with the season of that jar, not of the new record', async () => {
      entries.findByIdAndUpdate.mockReturnValue(
        leanResult(entry({ season: SEASON.SUMMER })),
      );

      await service.updateEntry(
        String(entryId),
        patch({ season: SEASON.SUMMER, amountKop: 100000 }),
        'boss',
      );

      const rows = audit.save.mock.calls[0][0] as any[];

      expect(rows.map(({ season, year }) => [season, year])).toEqual([
        [SEASON.SPRING, 2027],
        [SEASON.SUMMER, 2027],
      ]);
    });

    describe('when the project of the record is gone', () => {
      const order = (extra: Partial<IncomeEntry> = {}) =>
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

  describe('with support budgets and expenses', () => {
    const allocationEntry = (
      extra: Partial<AllocationEntry> = {},
    ): AllocationEntry => ({
      _id: new Types.ObjectId(),
      type: ENTRY_TYPE.ALLOCATION,
      direction: SUPPORT_DIRECTION.SITE,
      amountKop: 100000,
      date: '2027-05-10',
      season: SEASON.SPRING,
      year: 2027,
      createdBy: 'root',
      ...extra,
    });

    const expenseEntry = (extra: Partial<ExpenseEntry> = {}): ExpenseEntry => ({
      _id: entryId,
      type: ENTRY_TYPE.EXPENSE,
      kind: EXPENSE_KIND.CARD,
      section: EXPENSE_SECTION.SUPPORT,
      direction: SUPPORT_DIRECTION.SITE,
      amountKop: 10000,
      nickname: 'Аня',
      requisite: '•••• 1111',
      date: '2027-05-10',
      season: SEASON.SPRING,
      year: 2027,
      createdBy: 'root',
      ...extra,
    });

    const everything = (list: BudgetEntry[]) =>
      entries.aggregate.mockResolvedValue(
        list.map((item: any) => ({
          lastDate: item.date,
          _id: {
            type: item.type,
            source: item.source,
            kind: item.kind,
            section: item.section,
            direction: item.direction,
            amountKop: item.amountKop,
            season: item.season,
            year: item.year,
            projectId: item.projectId,
            title: item.title,
            nickname: item.nickname,
          },
          count: 1,
        })) as any,
      );

    const richJar = entry({ _id: new Types.ObjectId(), amountKop: 400000 });
    const funded = [richJar, allocationEntry({ amountKop: 100000 })];

    const paid = (lines: object[], extra: object = {}): any => ({
      date: '2027-05-10',
      lines,
      ...extra,
    });

    const card = {
      kind: EXPENSE_KIND.CARD,
      amountKop: 20000,
      section: EXPENSE_SECTION.SUPPORT as
        | EXPENSE_SECTION.SUPPORT
        | EXPENSE_SECTION.ORDERS,
      direction: SUPPORT_DIRECTION.SITE,
      nickname: 'Аня',
      requisite: '4111 1111 1111 1111',
    };

    describe('findEntries by type', () => {
      it('lists one kind of record when asked', async () => {
        const sort = vi.fn().mockReturnValue({
          skip: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([]),
            }),
          }),
        });

        entries.find.mockReturnValue({ sort } as any);
        entries.countDocuments.mockResolvedValue(0 as any);

        await service.findEntries({
          page: 1,
          perPage: 10,
          type: ENTRY_TYPE.EXPENSE,
        });

        expect(entries.find).toHaveBeenCalledWith({ type: ENTRY_TYPE.EXPENSE });
        expect(entries.countDocuments).toHaveBeenCalledWith({
          type: ENTRY_TYPE.EXPENSE,
        });
      });
    });

    describe('createExpenses', () => {
      beforeEach(() => everything(funded));

      it('writes the payout in the season of its date, signed by the admin, with only the last digits of the card', async () => {
        await service.createExpenses(
          paid([card], { comment: 'Дякуємо', date: '2027-02-01' }),
          'boss',
        );

        const written = entries.insertMany.mock.calls[0][0] as any[];

        expect(written).toEqual([
          expect.objectContaining({
            type: ENTRY_TYPE.EXPENSE,
            kind: EXPENSE_KIND.CARD,
            section: EXPENSE_SECTION.SUPPORT,
            direction: SUPPORT_DIRECTION.SITE,
            amountKop: 20000,
            nickname: 'Аня',
            requisite: '•••• 1111',
            comment: 'Дякуємо',
            date: '2027-02-01',
            season: SEASON.WINTER,
            year: 2027,
            createdBy: 'boss',
          }),
        ]);
        expect(JSON.stringify(written)).not.toContain('4111');
      });

      it('keeps a link to a jar as it is and drops the requisite of a gift to the team', async () => {
        await service.createExpenses(
          paid([
            {
              ...card,
              kind: EXPENSE_KIND.DONATION,
              requisite: 'https://send.monobank.ua/jar/abc',
            },
            {
              ...card,
              kind: EXPENSE_KIND.DEVELOPMENT,
              requisite: '4111 1111 1111 1111',
            },
          ]),
          'boss',
        );

        const [donation, development] = entries.insertMany.mock
          .calls[0][0] as any[];

        expect(donation.requisite).toBe('https://send.monobank.ua/jar/abc');
        expect(development).not.toHaveProperty('requisite');
      });

      it('keeps the direction of the support budget only there, and the title of the orders only there', async () => {
        everything([
          entry({
            source: INCOME_SOURCE.ORDER,
            amountKop: 100000,
            title: 'Т',
            projectId: undefined,
          }),
          allocationEntry(),
        ]);

        await service.createExpenses(
          paid([
            { ...card, title: 'Зайве', projectId: 'p1' },
            {
              ...card,
              section: EXPENSE_SECTION.ORDERS,
              title: 'Т',
              direction: SUPPORT_DIRECTION.SITE,
            },
          ]),
          'boss',
        );

        const [support, orders] = entries.insertMany.mock.calls[0][0] as any[];

        expect(support).not.toHaveProperty('title');
        expect(support).not.toHaveProperty('projectId');
        expect(orders).not.toHaveProperty('direction');
        expect(orders.title).toBe('Т');
      });

      it('takes the name of a chosen project from the project', async () => {
        projects.findName.mockResolvedValue('Вітробой');
        everything([
          entry({
            source: INCOME_SOURCE.ORDER,
            amountKop: 100000,
            projectId: 'p1',
            title: 'Вітробой',
          }),
        ]);

        await service.createExpenses(
          paid([
            {
              ...card,
              section: EXPENSE_SECTION.ORDERS,
              direction: undefined,
              projectId: 'p1',
              title: 'що завгодно',
              amountKop: 5000,
            },
          ]),
          'boss',
        );

        expect(entries.insertMany).toHaveBeenCalledWith([
          expect.objectContaining({ projectId: 'p1', title: 'Вітробой' }),
        ]);
        expect(rowsWritten()).toEqual([['orders:project:p1', -5000, 85000]]);
      });

      describe('when the project of the title is gone', () => {
        const orderFor = (title: string) =>
          entry({
            source: INCOME_SOURCE.ORDER,
            amountKop: 100000,
            projectId: 'p1',
            title,
          });
        const pay = () =>
          service.createExpenses(
            paid([
              {
                ...card,
                section: EXPENSE_SECTION.ORDERS,
                direction: undefined,
                projectId: 'p1',
                amountKop: 5000,
              },
            ]),
            'boss',
          );
        const newestRecord = (found: { title: string } | null) =>
          entries.findOne.mockReturnValue({
            sort: () => ({
              select: () => ({ lean: vi.fn().mockResolvedValue(found) }),
            }),
          } as any);

        beforeEach(() => {
          projects.findName.mockRejectedValue(
            new NotFoundException('Проєкт не знайдено'),
          );
          everything([orderFor('Вітробой')]);
        });

        it('pays out of the budget under the name it already has', async () => {
          newestRecord({ title: 'Вітробой' });

          await pay();

          expect(entries.findOne).toHaveBeenCalledWith({
            projectId: 'p1',
            title: { $exists: true },
          });
          expect(entries.insertMany).toHaveBeenCalledWith([
            expect.objectContaining({ projectId: 'p1', title: 'Вітробой' }),
          ]);
          expect(rowsWritten()).toEqual([['orders:project:p1', -5000, 85000]]);
        });

        it('still answers 404 when no budget was ever made for it', async () => {
          newestRecord(null);

          await expect(pay()).rejects.toThrow(NotFoundException);
          expect(entries.insertMany).not.toHaveBeenCalled();
        });

        it('does not let a new income be recorded for it', async () => {
          await expect(
            service.createIncomes(
              {
                ...period,
                lines: [
                  {
                    source: INCOME_SOURCE.ORDER,
                    amountKop: 1000,
                    projectId: 'p1',
                  },
                ],
              },
              'boss',
            ),
          ).rejects.toThrow(NotFoundException);
          expect(entries.findOne).not.toHaveBeenCalled();
        });
      });

      it('audits the side the money came from, with what it has left', async () => {
        await service.createExpenses(paid([card]), 'boss');

        expect(rowsWritten()).toEqual([['support:site', -20000, 80000]]);
        expect(audit.operation).toHaveBeenCalledWith(
          AUDIT_KIND.EXPENSE_CREATED,
          'boss',
          expect.stringContaining('На карту'),
        );
      });

      it('audits a gift to the team on the three sides it touches', async () => {
        await service.createExpenses(
          paid([{ ...card, kind: EXPENSE_KIND.DEVELOPMENT }]),
          'boss',
        );

        expect(rowsWritten()).toEqual([
          ['support:site', -20000, 80000],
          ['jar:2027-spring', 20000, 320000],
          ['lisodari:аня', 20000, 20000],
        ]);
      });

      it('refuses more than the budget holds, with the numbers, and writes nothing', async () => {
        await expect(
          service.createExpenses(
            paid([{ ...card, amountKop: 100001 }]),
            'boss',
          ),
        ).rejects.toThrow(ConflictException);
        await expect(
          service.createExpenses(
            paid([{ ...card, amountKop: 100001 }]),
            'boss',
          ),
        ).rejects.toThrow(/Підтримка: Сайт.*1\s?000,00 грн.*1\s?000,01 грн/);

        expect(entries.insertMany).not.toHaveBeenCalled();
        expect(audit.save).not.toHaveBeenCalled();
      });

      it('adds up the payouts of one request before it decides', async () => {
        await expect(
          service.createExpenses(
            paid([
              { ...card, amountKop: 60000 },
              { ...card, amountKop: 60000 },
            ]),
            'boss',
          ),
        ).rejects.toThrow(ConflictException);
      });

      it('refuses to pay out of a title that has no budget', async () => {
        await expect(
          service.createExpenses(
            paid([
              {
                ...card,
                section: EXPENSE_SECTION.ORDERS,
                direction: undefined,
                title: 'Невідомий',
              },
            ]),
            'boss',
          ),
        ).rejects.toThrow(/Тістечка: Невідомий/);
      });

      it('refuses a date in the future', async () => {
        await expect(
          service.createExpenses(paid([card], { date: '2027-05-11' }), 'boss'),
        ).rejects.toThrow(BadRequestException);

        expect(entries.insertMany).not.toHaveBeenCalled();
      });
    });

    describe('updateExpense', () => {
      const patch = (extra: Record<string, unknown> = {}) => ({
        ...card,
        date: '2027-05-10',
        requisite: '•••• 1111',
        amountKop: 15000,
        ...extra,
      });

      beforeEach(() => {
        existing(expenseEntry() as any);
        everything([...funded, expenseEntry()]);
        entries.findByIdAndUpdate.mockReturnValue(
          leanResult(expenseEntry({ amountKop: 15000 })),
        );
      });

      it('changes the payout and audits only the difference', async () => {
        await service.updateExpense(String(entryId), patch(), 'boss');

        expect(rowsWritten()).toEqual([['support:site', -5000, 85000]]);
        expect(audit.operation).toHaveBeenCalledWith(
          AUDIT_KIND.EXPENSE_UPDATED,
          'boss',
          expect.any(String),
        );
      });

      it('keeps the masked number when it comes back as it was, and masks a new one', async () => {
        await service.updateExpense(String(entryId), patch(), 'boss');

        expect(
          (entries.findByIdAndUpdate.mock.calls[0][1] as any).$set,
        ).toEqual(
          expect.objectContaining({
            requisite: '•••• 1111',
            updatedBy: 'boss',
          }),
        );

        await service.updateExpense(
          String(entryId),
          patch({ requisite: '5555 5555 5555 4444' }),
          'boss',
        );

        expect(
          (entries.findByIdAndUpdate.mock.calls[1][1] as any).$set.requisite,
        ).toBe('•••• 4444');
      });

      it('removes what the payout no longer has', async () => {
        await service.updateExpense(String(entryId), patch(), 'boss');

        expect(
          (entries.findByIdAndUpdate.mock.calls[0][1] as any).$unset,
        ).toEqual({ projectId: '', title: '', comment: '' });
      });

      it('refuses a payout of more than the budget holds', async () => {
        await expect(
          service.updateExpense(
            String(entryId),
            patch({ amountKop: 100001 }),
            'boss',
          ),
        ).rejects.toThrow(ConflictException);

        expect(entries.findByIdAndUpdate).not.toHaveBeenCalled();
      });

      it('answers 400 for a record that is not a payout and 404 for an unknown one', async () => {
        existing(entry());

        await expect(
          service.updateExpense(String(entryId), patch(), 'boss'),
        ).rejects.toThrow('Цей запис не є частуванням');

        existing(null);

        await expect(
          service.updateExpense(String(entryId), patch(), 'boss'),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('updateSupport', () => {
      const targets = (...list: [SUPPORT_DIRECTION, number][]) => ({
        ...period,
        targets: list.map(([direction, targetKop]) => ({
          direction,
          targetKop,
        })),
      });

      beforeEach(() => everything(funded));

      it('records the difference to what a direction holds, taking it from the jar of the chosen season', async () => {
        const result = await service.updateSupport(
          targets(
            [SUPPORT_DIRECTION.SITE, 150000],
            [SUPPORT_DIRECTION.BOTS, 20000],
            [SUPPORT_DIRECTION.SERVER, 0],
          ),
          'boss',
        );

        expect(result).toHaveLength(2);
        expect(entries.insertMany).toHaveBeenCalledWith([
          expect.objectContaining({
            type: ENTRY_TYPE.ALLOCATION,
            direction: SUPPORT_DIRECTION.SITE,
            amountKop: 50000,
            ...period,
            createdBy: 'boss',
          }),
          expect.objectContaining({
            direction: SUPPORT_DIRECTION.BOTS,
            amountKop: 20000,
          }),
        ]);
        expect(rowsWritten()).toEqual([
          ['jar:2027-spring', -50000, 250000],
          ['support:site', 50000, 150000],
          ['jar:2027-spring', -20000, 230000],
          ['support:bots', 20000, 20000],
        ]);
      });

      it('puts the money back into the jar when a direction is lowered', async () => {
        await service.updateSupport(
          targets([SUPPORT_DIRECTION.SITE, 20000]),
          'boss',
        );

        expect(entries.insertMany).toHaveBeenCalledWith([
          expect.objectContaining({ amountKop: -80000 }),
        ]);
        expect(rowsWritten()).toEqual([
          ['jar:2027-spring', 80000, 380000],
          ['support:site', -80000, 20000],
        ]);
      });

      it('counts what a direction has left after its payouts, not what it was given', async () => {
        everything([...funded, expenseEntry({ amountKop: 30000 })]);

        await service.updateSupport(
          targets([SUPPORT_DIRECTION.SITE, 100000]),
          'boss',
        );

        expect(entries.insertMany).toHaveBeenCalledWith([
          expect.objectContaining({ amountKop: 30000 }),
        ]);
      });

      it('says nothing changed, and writes nothing', async () => {
        await expect(
          service.updateSupport(
            targets([SUPPORT_DIRECTION.SITE, 100000]),
            'boss',
          ),
        ).rejects.toThrow('Бюджети напрямків не змінилися');

        expect(entries.insertMany).not.toHaveBeenCalled();
      });

      it('refuses to give directions more than the jar of the season holds', async () => {
        await expect(
          service.updateSupport(
            targets([SUPPORT_DIRECTION.SITE, 100000 + 300001]),
            'boss',
          ),
        ).rejects.toThrow(/Банка Весна 2027/);

        expect(entries.insertMany).not.toHaveBeenCalled();
      });

      it('reads the journal once, not once to plan and once to check', async () => {
        await service.updateSupport(
          targets([SUPPORT_DIRECTION.SITE, 150000]),
          'boss',
        );

        expect(entries.aggregate).toHaveBeenCalledTimes(1);
      });

      it('names the operation after the directions, from what they held to what they hold', async () => {
        await service.updateSupport(
          targets([SUPPORT_DIRECTION.SITE, 150000]),
          'boss',
        );

        expect(audit.operation).toHaveBeenCalledWith(
          AUDIT_KIND.SUPPORT_UPDATED,
          'boss',
          expect.stringMatching(/Сайт 1\s?000,00 грн → 1\s?500,00 грн/),
        );
      });

      it('refuses a date in the future', async () => {
        await expect(
          service.updateSupport(
            {
              ...targets([SUPPORT_DIRECTION.SITE, 1]),
              date: '2027-05-11',
            },
            'boss',
          ),
        ).rejects.toBeInstanceOf(BadRequestException);
      });
    });

    describe('previewSupport', () => {
      const targets = (...list: [SUPPORT_DIRECTION, number][]) => ({
        ...period,
        targets: list.map(([direction, targetKop]) => ({
          direction,
          targetKop,
        })),
      });

      beforeEach(() => everything(funded));

      it('says what the directions would take out of the jar, and what is left in it', async () => {
        const preview = await service.previewSupport(
          targets(
            [SUPPORT_DIRECTION.SITE, 150000],
            [SUPPORT_DIRECTION.BOTS, 20000],
            [SUPPORT_DIRECTION.SERVER, 0],
          ),
        );

        expect(preview).toEqual({
          moves: [
            {
              direction: SUPPORT_DIRECTION.SITE,
              nowKop: 100000,
              targetKop: 150000,
              deltaKop: 50000,
            },
            {
              direction: SUPPORT_DIRECTION.BOTS,
              nowKop: 0,
              targetKop: 20000,
              deltaKop: 20000,
            },
          ],
          takenKop: 70000,
          jarKop: 300000,
          jarAfterKop: 230000,
          problem: null,
        });
      });

      it('counts a lowered direction as money given back', async () => {
        const preview = await service.previewSupport(
          targets([SUPPORT_DIRECTION.SITE, 20000]),
        );

        expect(preview).toMatchObject({
          takenKop: -80000,
          jarKop: 300000,
          jarAfterKop: 380000,
        });
      });

      it('names the problem the save would have, and writes nothing', async () => {
        const preview = await service.previewSupport(
          targets([SUPPORT_DIRECTION.SITE, 100000 + 300001]),
        );

        expect(preview.problem).toMatch(/Банка Весна 2027/);
        expect(preview.jarAfterKop).toBe(-1);
        expect(entries.insertMany).not.toHaveBeenCalled();
        expect(audit.save).not.toHaveBeenCalled();
      });

      it('has no moves when nothing changes', async () => {
        const preview = await service.previewSupport(
          targets([SUPPORT_DIRECTION.SITE, 100000]),
        );

        expect(preview).toMatchObject({ moves: [], takenKop: 0 });
      });
    });

    describe('payouts of crumbs', () => {
      const crumbsPayout = (extra: Partial<ExpenseEntry> = {}): ExpenseEntry =>
        expenseEntry({
          section: EXPENSE_SECTION.CRUMBS,
          direction: undefined,
          amountKop: 80000,
          crumbs: 40,
          coefficient: 2,
          crumbSeason: SEASON.WINTER,
          crumbYear: 2027,
          requestId: 'r1',
          ...extra,
        });
      const winterJar = entry({
        _id: new Types.ObjectId(),
        amountKop: 100000,
        season: SEASON.WINTER,
      });

      it('cannot be changed in the journal, as the crumbs have already left the nickname', async () => {
        existing(crumbsPayout() as any);
        everything([winterJar, crumbsPayout()]);

        await expect(
          service.updateExpense(
            String(entryId),
            {
              kind: EXPENSE_KIND.CARD,
              amountKop: 100,
              section: EXPENSE_SECTION.CRUMBS,
              nickname: 'Аня',
              requisite: '•••• 1111',
              date: '2027-05-10',
            } as any,
            'boss',
          ),
        ).rejects.toThrow(BadRequestException);
        expect(entries.findByIdAndUpdate).not.toHaveBeenCalled();
      });

      it('cannot be removed from the journal either', async () => {
        existing(crumbsPayout() as any);
        everything([winterJar, crumbsPayout()]);

        await expect(
          service.deleteEntry(String(entryId), 'boss'),
        ).rejects.toThrow(/крихти вже зняті/);
        expect(entries.deleteOne).not.toHaveBeenCalled();
      });

      it('are refused by commit when the jar of their season holds less', async () => {
        everything([winterJar]);

        const persist = vi.fn();

        await expect(
          service.commit(
            AUDIT_KIND.REQUEST_FULFILLED,
            'boss',
            'x',
            [created(crumbsPayout({ amountKop: 100001 }))],
            persist,
          ),
        ).rejects.toThrow(/Банка Зима 2027.*1\s?000,00 грн.*1\s?000,01 грн/);
        expect(persist).not.toHaveBeenCalled();
      });

      it('are audited as the jar of the crumb season losing, whatever season the date is in', async () => {
        everything([winterJar]);

        await service.commit(
          AUDIT_KIND.REQUEST_FULFILLED,
          'boss',
          'x',
          [created(crumbsPayout())],
          async () => 'saved',
          {
            extraRows: (head, saved) =>
              [{ ...head, saved, unit: 'crumbs' }] as any,
          },
        );

        const rows = audit.save.mock.calls[0][0] as any[];

        expect(rows[0]).toMatchObject({
          subjectKey: 'jar:2027-winter',
          deltaKop: -80000,
          balanceAfterKop: 20000,
          season: SEASON.WINTER,
          year: 2027,
        });
        expect(rows[1]).toMatchObject({ saved: 'saved', unit: 'crumbs' });
      });

      it('give the rates of the seasons from the journal and the tracks', async () => {
        everything([winterJar, crumbsPayout()]);
        tracks.getCoinsBySeason.mockResolvedValue([
          { season: SEASON.WINTER, year: 2027, coins: 400 },
          { season: SEASON.SPRING, year: 2027, coins: 100 },
        ]);

        expect(await service.seasonRates()).toEqual([
          // the payout is not taken off before the rate: 1000 / 400
          { season: SEASON.WINTER, year: 2027, coefficient: 2.5 },
          { season: SEASON.SPRING, year: 2027, coefficient: 0 },
        ]);
      });

      it('give the rates and the budgets of the titles from one read of the journal', async () => {
        everything([winterJar, crumbsPayout()]);
        tracks.getCoinsBySeason.mockResolvedValue([
          { season: SEASON.WINTER, year: 2027, coins: 400 },
        ]);

        const { rates, orders } = await service.requestFacts();

        expect(rates).toEqual([
          { season: SEASON.WINTER, year: 2027, coefficient: 2.5 },
        ]);
        expect(orders).toEqual([]);
        expect(entries.aggregate).toHaveBeenCalledTimes(1);
        expect(tracks.getCoinsBySeason).toHaveBeenCalledTimes(1);
      });
    });

    describe('deleting and editing records that others rely on', () => {
      it('removes an allocation and audits the jar getting the money back', async () => {
        const allocation = allocationEntry({ _id: entryId });

        existing(allocation);
        everything([richJar, allocation]);

        await service.deleteEntry(String(entryId), 'boss');

        expect(entries.deleteOne).toHaveBeenCalledWith({ _id: entryId });
        expect(rowsWritten()).toEqual([
          ['jar:2027-spring', 100000, 400000],
          ['support:site', -100000, 0],
        ]);
        expect(audit.operation).toHaveBeenCalledWith(
          AUDIT_KIND.ALLOCATION_DELETED,
          'boss',
          expect.stringContaining('Видалено виділення'),
        );
      });

      it('refuses to remove an allocation a direction has already spent', async () => {
        const allocation = allocationEntry({ _id: entryId });

        existing(allocation);
        everything([richJar, allocation, expenseEntry({ amountKop: 30000 })]);

        await expect(
          service.deleteEntry(String(entryId), 'boss'),
        ).rejects.toThrow(/Підтримка: Сайт/);

        expect(entries.deleteOne).not.toHaveBeenCalled();
      });

      it('removes a payout and gives the money back to the direction', async () => {
        existing(expenseEntry());
        everything([...funded, expenseEntry()]);

        await service.deleteEntry(String(entryId), 'boss');

        expect(rowsWritten()).toEqual([['support:site', 10000, 100000]]);
        expect(audit.operation).toHaveBeenCalledWith(
          AUDIT_KIND.EXPENSE_DELETED,
          'boss',
          expect.stringContaining('Видалено частування'),
        );
      });

      it('refuses to remove an income whose money was already given to a direction', async () => {
        existing(richJar);
        everything([
          richJar,
          allocationEntry({ amountKop: 100000 }),
          allocationEntry({ amountKop: 250000 }),
        ]);

        await expect(
          service.deleteEntry(String(entryId), 'boss'),
        ).rejects.toThrow(/Банка Весна 2027/);

        expect(entries.deleteOne).not.toHaveBeenCalled();
      });

      it('refuses to move an income to another season when its jar would be left short', async () => {
        existing(richJar);
        everything([richJar, allocationEntry({ amountKop: 350000 })]);

        await expect(
          service.updateEntry(
            String(entryId),
            {
              ...period,
              season: SEASON.SUMMER,
              source: INCOME_SOURCE.TEAM_JAR,
              amountKop: 400000,
            },
            'boss',
          ),
        ).rejects.toThrow(ConflictException);

        expect(entries.findByIdAndUpdate).not.toHaveBeenCalled();
      });

      it('does not let the income editor change a payout', async () => {
        existing(expenseEntry());

        await expect(
          service.updateEntry(
            String(entryId),
            {
              ...period,
              source: INCOME_SOURCE.TEAM_JAR,
              amountKop: 1,
            },
            'boss',
          ),
        ).rejects.toThrow('Цей запис не є надходженням');
      });
    });

    describe('taking turns', () => {
      it('lets a write wait for the one before it, so two cannot spend the same money', async () => {
        everything(funded);

        let release: () => void = () => undefined;

        entries.insertMany.mockImplementationOnce(
          (() =>
            new Promise<void>((resolve) => {
              release = resolve;
            })) as any,
        );

        const first = service.createExpenses(paid([card]), 'boss');
        const second = service.createExpenses(paid([card]), 'boss');

        await vi.advanceTimersByTimeAsync(10);

        expect(entries.aggregate).toHaveBeenCalledTimes(1);

        release();
        await Promise.all([first, second]);

        expect(entries.aggregate).toHaveBeenCalledTimes(2);
        expect(entries.insertMany).toHaveBeenCalledTimes(2);
      });

      it('goes on with the next write when one fails', async () => {
        everything(funded);

        await expect(
          service.createExpenses(
            paid([{ ...card, amountKop: 999999 }]),
            'boss',
          ),
        ).rejects.toThrow(ConflictException);
        await expect(
          service.createExpenses(paid([card]), 'boss'),
        ).resolves.toHaveLength(1);
      });
    });
  });
});
