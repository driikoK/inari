import { randomUUID } from 'node:crypto';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { todayInKyiv } from '../projects/layout.js';
import { escapeRegExp } from '../shared/index.js';
import type { AuditQueryData } from './data/index.js';
import { AUDIT_KIND, AUDIT_UNIT, BUDGET_ERROR } from './enums/index.js';
import type {
  AuditOperation,
  AuditRow,
  CrumbAuditSum,
  MoneyAuditSum,
  NewAuditRow,
  OperationHead,
  OperationRow,
  Paged,
} from './interfaces/index.js';

type StoredRow = AuditRow & { _id?: unknown };

@Injectable()
export class BudgetAuditService {
  private readonly logger = new Logger(BudgetAuditService.name);

  constructor(
    @Inject('BUDGET_AUDIT_MODEL') private readonly auditModel: Model<AuditRow>,
  ) {}

  operation(
    kind: AUDIT_KIND,
    actor: string,
    operationDescription: string,
  ): OperationHead {
    const at = new Date();

    return {
      operationId: randomUUID(),
      at,
      day: todayInKyiv(at),
      kind,
      actor,
      operationDescription,
    };
  }

  async record(rows: NewAuditRow[]): Promise<void> {
    if (rows.length === 0) return;

    const counters = new Map<string, number>();

    await this.auditModel.insertMany(
      rows.map((row) => {
        const seq = counters.get(row.operationId) ?? 0;

        counters.set(row.operationId, seq + 1);

        return { ...row, seq };
      }),
    );
  }

  // The operation is already done when this runs, so a failure must say so
  // instead of looking like an operation that did not happen.
  async save(rows: NewAuditRow[]): Promise<void> {
    try {
      await this.record(rows);
    } catch (error) {
      this.logger.error('Не вдалося записати аудит операції', error);

      throw new InternalServerErrorException(
        'Операцію виконано, але запис в аудит не збережено',
        BUDGET_ERROR.AUDIT_NOT_SAVED,
      );
    }
  }

  // What the rows of money add up to on every side, and how many rows that is
  async moneySums(): Promise<MoneyAuditSum[]> {
    const groups = await this.auditModel.aggregate<{
      _id: string;
      label: string;
      kop: number;
      rows: number;
    }>([
      { $match: { unit: { $ne: AUDIT_UNIT.CRUMBS } } },
      {
        $group: {
          _id: '$subjectKey',
          label: { $max: '$subjectLabel' },
          kop: { $sum: '$deltaKop' },
          rows: { $sum: 1 },
        },
      },
    ]);

    return groups.map(({ _id, label, kop, rows }) => ({
      key: _id,
      label,
      kop,
      rows,
    }));
  }

  // The records of the journal that have at least one row of money
  async auditedEntryIds(): Promise<Set<string>> {
    const ids = await this.auditModel.distinct('entryId', {
      unit: { $ne: AUDIT_UNIT.CRUMBS },
      entryId: { $ne: null },
    });

    return new Set(ids.map(String));
  }

  // What the rows of crumbs add up to for every nickname, by kind of operation,
  // and how many rows that is
  async crumbSums(): Promise<CrumbAuditSum[]> {
    const groups = await this.auditModel.aggregate<{
      _id: { key: string; kind: AUDIT_KIND };
      crumbs: number;
      rows: number;
    }>([
      { $match: { unit: AUDIT_UNIT.CRUMBS } },
      {
        $group: {
          _id: { key: '$subjectKey', kind: '$kind' },
          crumbs: { $sum: '$deltaCrumbs' },
          rows: { $sum: 1 },
        },
      },
    ]);

    return groups.map(({ _id, crumbs, rows }) => ({
      key: _id.key,
      kind: _id.kind,
      crumbs,
      rows,
    }));
  }

  // The crumbs a fulfilled request took off a nickname for each payout it wrote
  async crumbsOfPayouts(): Promise<Map<string, number>> {
    const groups = await this.auditModel.aggregate<{
      _id: string;
      crumbs: number;
    }>([
      {
        $match: {
          unit: AUDIT_UNIT.CRUMBS,
          kind: AUDIT_KIND.REQUEST_FULFILLED,
        },
      },
      { $group: { _id: '$entryId', crumbs: { $sum: '$deltaCrumbs' } } },
    ]);

    return new Map(groups.map(({ _id, crumbs }) => [_id, crumbs]));
  }

  async find(query: AuditQueryData): Promise<Paged<AuditOperation>> {
    const { page, perPage } = query;

    const [facets] = await this.auditModel.aggregate<{
      total: { n: number }[];
      ids: { _id: string }[];
    }>(
      [
        { $match: this.matchOf(query) },
        { $group: { _id: '$operationId', at: { $max: '$at' } } },
        { $sort: { at: -1, _id: 1 } },
        {
          $facet: {
            total: [{ $count: 'n' }],
            ids: [{ $skip: (page - 1) * perPage }, { $limit: perPage }],
          },
        },
      ],
      { allowDiskUse: true },
    );

    const ids = facets.ids.map(({ _id }) => _id);
    const rows = ids.length
      ? await this.auditModel
          .find({ operationId: { $in: ids } })
          .sort({ seq: 1 })
          .lean<StoredRow[]>()
      : [];

    return {
      data: ids.map((id) =>
        this.toOperation(rows.filter((row) => row.operationId === id)),
      ),
      page,
      perPage,
      total: facets.total[0]?.n ?? 0,
    };
  }

  private matchOf({ from, to, season, year, kind, search }: AuditQueryData) {
    const match: Record<string, unknown> = {};

    if (from || to) {
      match.day = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
    }

    if (season && year) Object.assign(match, { season, year });

    if (kind) match.kind = kind;

    if (search) {
      const pattern = new RegExp(escapeRegExp(search), 'i');

      match.$or = [{ subjectLabel: pattern }, { actor: pattern }];
    }

    return match;
  }

  private toOperation(rows: StoredRow[]): AuditOperation {
    const [{ operationId, at, day, kind, actor, operationDescription }] = rows;

    return {
      operationId,
      at,
      day,
      kind,
      actor,
      description: operationDescription,
      rows: rows.map(
        ({ _id, operationId: _op, operationDescription: _desc, ...row }) =>
          // Rows from before crumbs were audited have no unit, they are money
          ({ ...row, unit: row.unit ?? AUDIT_UNIT.MONEY }) as OperationRow,
      ),
    };
  }
}
