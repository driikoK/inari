import { createMock, type DeepMocked } from '@golevelup/ts-vitest';
import { Model } from 'mongoose';
import { vi } from 'vitest';
import { MembersService } from '../members/members.service.js';
import { SEASON } from '../shared/index.js';
import { TrackService } from '../tracks/tracks.service.js';
import { BudgetAuditService } from './budget-audit.service.js';
import { BudgetService } from './budget.service.js';
import {
  AUDIT_KIND,
  ENTRY_TYPE,
  INCOME_SOURCE,
  RECONCILE_CHECK,
  RECONCILE_STATUS,
} from './enums/index.js';
import type {
  BudgetEntry,
  EntryGroup,
  IncomeEntry,
  WithdrawalRequest,
} from './interfaces/index.js';
import { ReconcileService } from './reconcile.service.js';

describe('ReconcileService', () => {
  const at = new Date('2027-10-05T12:00:00Z');
  const entry: IncomeEntry = {
    _id: 'i1',
    type: ENTRY_TYPE.INCOME,
    source: INCOME_SOURCE.TEAM_JAR,
    amountKop: 100000,
    date: '2027-05-10',
    season: SEASON.SPRING,
    year: 2027,
    createdBy: 'root',
  };
  const crumbs = (nickname: string, coins: number, audited = true) =>
    ({
      nickname,
      coins,
      seasons: coins ? [{ season: SEASON.SPRING, year: 2027, coins }] : [],
      ...(audited && { crumbsAuditedAt: new Date() }),
    }) as any;

  let service: ReconcileService;
  let entries: DeepMocked<Model<BudgetEntry>>;
  let requests: DeepMocked<Model<WithdrawalRequest>>;
  let budget: DeepMocked<BudgetService>;
  let audit: DeepMocked<BudgetAuditService>;
  let members: DeepMocked<MembersService>;
  let tracks: DeepMocked<TrackService>;

  const leaned = (value: unknown) =>
    ({ lean: vi.fn().mockResolvedValue(value) }) as any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(at);

    entries = createMock<Model<BudgetEntry>>();
    requests = createMock<Model<WithdrawalRequest>>();
    budget = createMock<BudgetService>();
    audit = createMock<BudgetAuditService>();
    members = createMock<MembersService>();
    tracks = createMock<TrackService>();
    service = new ReconcileService(
      entries,
      requests,
      budget,
      audit,
      members,
      tracks,
    );

    budget.exclusive.mockImplementation((job: () => Promise<unknown>) => job());
    budget.loadGroups.mockResolvedValue([
      { ...entry, count: 1 },
    ] as EntryGroup[]);
    entries.find.mockReturnValue(leaned([entry]));
    requests.find.mockReturnValue(leaned([]));
    audit.moneySums.mockResolvedValue([
      {
        key: 'jar:2027-spring',
        label: 'Банка Весна 2027',
        kop: 100000,
        rows: 5,
      },
    ]);
    audit.auditedEntryIds.mockResolvedValue(new Set(['i1']));
    audit.crumbSums.mockResolvedValue([
      {
        key: 'crumbs:аня',
        kind: AUDIT_KIND.CRUMBS_INITIAL,
        crumbs: 100,
        rows: 2,
      },
    ]);
    audit.crumbsOfPayouts.mockResolvedValue(new Map());
    members.crumbBalances.mockResolvedValue([crumbs('Аня', 100)]);
    tracks.getCoinsByNickname.mockResolvedValue([
      { nickname: 'Аня', season: SEASON.SPRING, year: 2027, coins: 100 },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('run', () => {
    it('says all is well when every source agrees, and counts what it looked at, the rows of the audit by its sums', async () => {
      const report = await service.run();

      expect(report.status).toBe(RECONCILE_STATUS.OK);
      expect(report.checkedAt).toEqual(at);
      expect(report.counts).toEqual({
        entries: 1,
        auditRows: 7,
        members: 1,
        requests: 0,
      });
    });

    it('waits for the money writes in progress, so a half-done record is not a gap', async () => {
      await service.run();

      expect(budget.exclusive).toHaveBeenCalledTimes(1);
    });

    it('finds a record that has no row in the audit', async () => {
      audit.auditedEntryIds.mockResolvedValue(new Set());

      const report = await service.run();

      expect(report.status).toBe(RECONCILE_STATUS.ERROR);
      expect(
        report.checks
          .filter(({ status }) => status === RECONCILE_STATUS.ERROR)
          .map(({ key }) => key),
      ).toContain(RECONCILE_CHECK.UNAUDITED_ENTRIES);
    });

    describe('with a fulfilled request', () => {
      const payout = {
        ...entry,
        _id: 'p1',
        type: ENTRY_TYPE.EXPENSE,
        kind: 'card',
        section: 'crumbs',
        nickname: 'Аня',
        amountKop: 2500,
        crumbs: 10,
        coefficient: 2.5,
        crumbSeason: SEASON.WINTER,
        crumbYear: 2027,
        requestId: 'r1',
      };
      const request = {
        _id: 'r1',
        status: 'done',
        username: 'anya',
        nickname: 'Аня',
        groupId: 'g1',
        kind: 'card',
        isOrder: false,
        crumbs: 10,
        paidKop: 2500,
        parts: [
          {
            season: SEASON.WINTER,
            year: 2027,
            crumbs: 10,
            coefficient: 2.5,
            amountKop: 2500,
          },
        ],
      };
      const requestsCheck = (report: { checks: { key: string }[] }) =>
        report.checks.find(
          ({ key }) => key === RECONCILE_CHECK.REQUESTS,
        ) as any;

      beforeEach(() => {
        entries.find.mockReturnValue(leaned([entry, payout]));
        requests.find.mockReturnValue(leaned([request]));
      });

      it('takes the crumbs the audit removed for the payout from one read of the audit', async () => {
        audit.crumbsOfPayouts.mockResolvedValue(new Map([['p1', -10]]));

        const report = await service.run();

        expect(requestsCheck(report).total).toBe(0);
        expect(audit.crumbsOfPayouts).toHaveBeenCalledWith();
      });

      it('names a payout whose crumbs the audit never removed', async () => {
        const report = await service.run();

        expect(requestsCheck(report).status).toBe(RECONCILE_STATUS.ERROR);
      });
    });

    it('changes nothing', async () => {
      await service.run();

      expect(members.auditOpening).not.toHaveBeenCalled();
      expect(audit.record).not.toHaveBeenCalled();
      expect(audit.save).not.toHaveBeenCalled();
    });
  });

  describe('writeOpening', () => {
    beforeEach(() => {
      members.crumbBalances.mockResolvedValue([
        crumbs('Аня', 100, false),
        crumbs('Борис', 40),
        crumbs('Нуль', 0, false),
        crumbs('Віка', 5, false),
      ]);
      members.auditOpening.mockResolvedValue(true);
    });

    it('opens the nicknames that have crumbs and no opening state, signed by the admin', async () => {
      await expect(service.writeOpening('boss')).resolves.toEqual({
        written: ['Аня', 'Віка'],
      });

      expect(members.auditOpening.mock.calls).toEqual([
        ['Аня', 'boss'],
        ['Віка', 'boss'],
      ]);
    });

    it('does not list a nickname somebody else opened in the meantime', async () => {
      members.auditOpening.mockResolvedValueOnce(false);

      await expect(service.writeOpening('boss')).resolves.toEqual({
        written: ['Віка'],
      });
    });

    it('stops with the error when the audit cannot be written', async () => {
      members.auditOpening
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('db down'));

      await expect(service.writeOpening('boss')).rejects.toThrow('db down');
    });
  });
});
