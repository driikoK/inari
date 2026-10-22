import { Test } from '@nestjs/testing';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { SEASON } from '../shared/index.js';
import { BudgetAuditService } from './budget-audit.service.js';
import { CrumbAuditService } from './crumb-audit.service.js';
import { AUDIT_KIND, AUDIT_UNIT } from './enums/index.js';
import type { OperationHead } from './interfaces/index.js';

describe('CrumbAuditService', () => {
  let service: CrumbAuditService;
  let audit: DeepMocked<BudgetAuditService>;

  const head = (kind: AUDIT_KIND, actor: string): OperationHead => ({
    operationId: 'op1',
    at: new Date('2027-05-10T09:00:00Z'),
    day: '2027-05-10',
    kind,
    actor,
    operationDescription: 'описано',
  });

  const change = (nickname: string, delta: number) => ({
    nickname,
    season: SEASON.SPRING,
    year: 2027,
    delta,
    coins: 100 + delta,
    seasonCoins: 50 + delta,
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CrumbAuditService,
        {
          provide: BudgetAuditService,
          useValue: createMock<BudgetAuditService>(),
        },
      ],
    }).compile();

    service = module.get(CrumbAuditService);
    audit = module.get(BudgetAuditService);
    audit.operation.mockImplementation((kind, actor) => head(kind, actor));
  });

  describe('record', () => {
    it('writes a row for every change under one operation, and tells when the audit fails', async () => {
      await service.record(AUDIT_KIND.TRACK_CREATED, 'boss', 'Додано трек', [
        { change: change('Аня', 10), entryId: 't1', before: null, after: null },
        {
          change: change('Борис', 5),
          entryId: 't2',
          before: null,
          after: null,
        },
      ]);

      expect(audit.operation).toHaveBeenCalledTimes(1);
      expect(audit.operation).toHaveBeenCalledWith(
        AUDIT_KIND.TRACK_CREATED,
        'boss',
        'Додано трек',
      );
      expect(audit.record).not.toHaveBeenCalled();

      const rows = audit.save.mock.calls[0][0];

      expect(rows).toHaveLength(2);
      expect(new Set(rows.map(({ operationId }) => operationId)).size).toBe(1);
      expect(rows.map((row) => row.unit)).toEqual([
        AUDIT_UNIT.CRUMBS,
        AUDIT_UNIT.CRUMBS,
      ]);
      expect(rows.map((row) => row.subjectLabel)).toEqual([
        'Крихти: Аня',
        'Крихти: Борис',
      ]);
    });

    it('writes nothing for no changes', async () => {
      await service.record(AUDIT_KIND.TRACK_CREATED, 'boss', 'x', []);

      expect(audit.operation).not.toHaveBeenCalled();
      expect(audit.save).not.toHaveBeenCalled();
    });
  });

  describe('recordOpening', () => {
    it('writes the starting state of a nickname as an operation of its own', async () => {
      await service.recordOpening(
        'boss',
        'Аня',
        { coins: 100, seasons: [] },
        SEASON.SPRING,
        2027,
      );

      expect(audit.operation).toHaveBeenCalledWith(
        AUDIT_KIND.CRUMBS_INITIAL,
        'boss',
        'Початковий стан: Аня — 100 крихт',
      );
      expect(audit.record.mock.calls[0][0]).toEqual([
        expect.objectContaining({
          kind: AUDIT_KIND.CRUMBS_INITIAL,
          subjectKey: 'crumbs:аня',
          deltaCrumbs: 100,
          balanceAfterCrumbs: 100,
        }),
      ]);
    });

    it('fails as it is, so the caller can give its claim back', async () => {
      audit.record.mockRejectedValue(new Error('db down'));

      await expect(
        service.recordOpening(
          'boss',
          'Аня',
          { coins: 1, seasons: [] },
          SEASON.SPRING,
          2027,
        ),
      ).rejects.toThrow('db down');
      expect(audit.save).not.toHaveBeenCalled();
    });
  });
});
