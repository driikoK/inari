import { InternalServerErrorException, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Model } from 'mongoose';
import { vi } from 'vitest';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { SEASON } from '../shared/index.js';
import { BudgetAuditService } from './budget-audit.service.js';
import {
  AUDIT_KIND,
  AUDIT_UNIT,
  BUDGET_ERROR,
  SIDE_KIND,
} from './enums/index.js';
import type { AuditRow } from './interfaces/index.js';

describe('BudgetAuditService', () => {
  let service: BudgetAuditService;
  let model: DeepMocked<Model<AuditRow>>;

  const row = (extra: Record<string, unknown> = {}) =>
    ({
      _id: 'mongo-id',
      operationId: 'op1',
      seq: 0,
      at: new Date('2027-05-10T09:00:00Z'),
      day: '2027-05-10',
      kind: AUDIT_KIND.INCOME_CREATED,
      actor: 'root',
      operationDescription: 'Додано надходження',
      unit: AUDIT_UNIT.MONEY,
      subjectKind: SIDE_KIND.JAR,
      subjectKey: 'jar:2027-spring',
      subjectLabel: 'Банка Весна 2027',
      deltaKop: 100,
      balanceAfterKop: 100,
      season: SEASON.SPRING,
      year: 2027,
      entryId: 'e1',
      before: null,
      after: null,
      ...extra,
    }) as unknown as AuditRow;

  const matchOf = () => (model.aggregate.mock.calls[0][0] as any[])[0].$match;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BudgetAuditService,
        {
          provide: 'BUDGET_AUDIT_MODEL',
          useValue: createMock<Model<AuditRow>>(),
        },
      ],
    }).compile();

    service = module.get(BudgetAuditService);
    model = module.get('BUDGET_AUDIT_MODEL');
  });

  describe('record', () => {
    it('numbers the rows of an operation in the order they were given', async () => {
      const { seq: _a, ...first } = row();
      const { seq: _b, ...second } = row({ subjectKey: 'orders:title:т' });

      await service.record([first, second]);

      expect(model.insertMany).toHaveBeenCalledWith([
        expect.objectContaining({ seq: 0, subjectKey: 'jar:2027-spring' }),
        expect.objectContaining({ seq: 1, subjectKey: 'orders:title:т' }),
      ]);
    });

    it('starts the numbering again for every operation written together', async () => {
      const { seq: _a, ...first } = row({ operationId: 'op1' });
      const { seq: _b, ...second } = row({ operationId: 'op1' });
      const { seq: _c, ...other } = row({ operationId: 'op2' });

      await service.record([first, second, other]);

      expect(
        (model.insertMany.mock.calls[0][0] as any[]).map(
          ({ operationId, seq }) => [operationId, seq],
        ),
      ).toEqual([
        ['op1', 0],
        ['op1', 1],
        ['op2', 0],
      ]);
    });

    it('writes nothing for no rows', async () => {
      await service.record([]);

      expect(model.insertMany).not.toHaveBeenCalled();
    });

    it('offers no way to change or remove a row', () => {
      expect(Object.getOwnPropertyNames(BudgetAuditService.prototype)).toEqual(
        expect.not.arrayContaining(['update', 'delete', 'remove']),
      );
    });
  });

  describe('operation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2027-05-10T21:30:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('names who did what, with a fresh id and the day in Kyiv', () => {
      const first = service.operation(AUDIT_KIND.TRACK_CREATED, 'root', 'x');
      const second = service.operation(AUDIT_KIND.TRACK_CREATED, 'root', 'x');

      expect(first).toMatchObject({
        kind: AUDIT_KIND.TRACK_CREATED,
        actor: 'root',
        operationDescription: 'x',
        day: '2027-05-11',
      });
      expect(first.at).toEqual(new Date('2027-05-10T21:30:00Z'));
      expect(first.operationId).not.toBe(second.operationId);
    });
  });

  describe('save', () => {
    beforeEach(() => {
      vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('writes the rows when the database is fine', async () => {
      const { seq: _a, ...first } = row();

      await service.save([first]);

      expect(model.insertMany).toHaveBeenCalledTimes(1);
    });

    it('says the operation is done but the audit is not, and marks it with a code', async () => {
      model.insertMany.mockRejectedValue(new Error('db down') as never);
      const { seq: _a, ...first } = row();

      const failure = await service.save([first]).catch((error) => error);

      expect(failure).toBeInstanceOf(InternalServerErrorException);
      expect(failure.message).toBe(
        'Операцію виконано, але запис в аудит не збережено',
      );
      expect(failure.getResponse()).toMatchObject({
        error: BUDGET_ERROR.AUDIT_NOT_SAVED,
        statusCode: 500,
      });
    });
  });

  describe('find', () => {
    const answer = (ids: string[], total: number, rows: AuditRow[]) => {
      model.aggregate.mockResolvedValue([
        { total: [{ n: total }], ids: ids.map((_id) => ({ _id })) },
      ] as any);
      model.find.mockReturnValue({
        sort: vi
          .fn()
          .mockReturnValue({ lean: vi.fn().mockResolvedValue(rows) }),
      } as any);
    };

    it('pages by operation, newest first, and keeps the order of the page', async () => {
      answer(['op2', 'op1'], 7, [
        row({ operationId: 'op1', seq: 0 }),
        row({ operationId: 'op2', seq: 0, actor: 'boss' }),
        row({ operationId: 'op2', seq: 1, subjectKey: 'orders:title:т' }),
      ]);

      const result = await service.find({ page: 2, perPage: 2 });

      const pipeline = model.aggregate.mock.calls[0][0] as any[];
      const facet = pipeline[3].$facet;

      expect(pipeline[1]).toEqual({
        $group: { _id: '$operationId', at: { $max: '$at' } },
      });
      expect(facet.ids).toEqual([{ $skip: 2 }, { $limit: 2 }]);
      expect(result.total).toBe(7);
      expect(result.data.map(({ operationId }) => operationId)).toEqual([
        'op2',
        'op1',
      ]);
      expect(result.data[0].actor).toBe('boss');
      expect(result.data[0].rows).toHaveLength(2);
    });

    it('treats a row from before crumbs were audited as money and keeps crumb rows as they are', async () => {
      const { unit: _unit, ...oldRow } = row({ operationId: 'op1' }) as any;

      answer(['op1', 'op2'], 2, [
        oldRow,
        row({
          operationId: 'op2',
          unit: AUDIT_UNIT.CRUMBS,
          subjectKind: SIDE_KIND.CRUMBS,
          deltaCrumbs: 12.5,
        }),
      ]);

      const { data } = await service.find({ page: 1, perPage: 20 });

      expect(data[0].rows[0]).toMatchObject({ unit: AUDIT_UNIT.MONEY });
      expect(data[1].rows[0]).toMatchObject({
        unit: AUDIT_UNIT.CRUMBS,
        deltaCrumbs: 12.5,
      });
    });

    it('lets the database spill a long history to disk instead of failing', async () => {
      answer([], 0, []);

      await service.find({ page: 1, perPage: 20 });

      const [, options] = model.aggregate.mock.calls[0] as unknown[];

      expect(options).toEqual({ allowDiskUse: true });
    });

    it('describes an operation once and leaves the database ids out of the rows', async () => {
      answer(['op1'], 1, [row()]);

      const [operation] = (await service.find({ page: 1, perPage: 20 })).data;

      expect(operation.description).toBe('Додано надходження');
      expect(operation.rows[0]).not.toHaveProperty('_id');
      expect(operation.rows[0]).not.toHaveProperty('operationId');
      expect(operation.rows[0]).not.toHaveProperty('operationDescription');
      expect(operation.rows[0]).toMatchObject({
        subjectLabel: 'Банка Весна 2027',
        deltaKop: 100,
      });
    });

    it('answers an empty page without a second query', async () => {
      answer([], 0, []);

      await expect(
        service.find({ page: 1, perPage: 20 }),
      ).resolves.toMatchObject({
        data: [],
        total: 0,
      });
      expect(model.find).not.toHaveBeenCalled();
    });

    it('matches everything when no filter is given', async () => {
      answer([], 0, []);

      await service.find({ page: 1, perPage: 20 });

      expect(matchOf()).toEqual({});
    });

    it('filters by the Kyiv day, the season and the kind', async () => {
      answer([], 0, []);

      await service.find({
        page: 1,
        perPage: 20,
        from: '2027-05-01',
        to: '2027-05-31',
        season: SEASON.SPRING,
        year: 2027,
        kind: AUDIT_KIND.INCOME_DELETED,
      });

      expect(matchOf()).toEqual({
        day: { $gte: '2027-05-01', $lte: '2027-05-31' },
        season: SEASON.SPRING,
        year: 2027,
        kind: AUDIT_KIND.INCOME_DELETED,
      });
    });

    it('searches the bank or person and the actor, taking what was typed literally', async () => {
      answer([], 0, []);

      await service.find({ page: 1, perPage: 20, search: 'a.b(' });

      const [{ subjectLabel }, { actor }] = matchOf().$or;

      expect(subjectLabel).toEqual(/a\.b\(/i);
      expect(actor).toEqual(/a\.b\(/i);
      expect(subjectLabel.test('xA.B(x')).toBe(true);
      expect(subjectLabel.test('xAxB(x')).toBe(false);
    });
  });
});
