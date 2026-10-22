import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isValidObjectId, Model, Types } from 'mongoose';
import { ProjectsService } from '../projects/projects.service.js';
import { todayInKyiv } from '../projects/layout.js';
import { TrackService } from '../tracks/tracks.service.js';
import { BudgetAuditService } from './budget-audit.service.js';
import {
  balancesOf,
  describeEntry,
  diffEffects,
  effectsOf,
  negate,
  snapshotOf,
  summarize,
} from './calc.js';
import type {
  CreateIncomesData,
  EntriesQueryData,
  IncomeLineData,
  UpdateIncomeData,
} from './data/index.js';
import {
  AUDIT_KIND,
  AUDIT_UNIT,
  ENTRY_TYPE,
  INCOME_SOURCE,
} from './enums/index.js';
import type {
  BudgetEntry,
  BudgetSummary,
  Effect,
  EntryFacts,
  EntryGroup,
  EntrySnapshot,
  NewAuditRow,
  OperationHead,
  Paged,
} from './interfaces/index.js';

type IncomeFields = Pick<BudgetEntry, 'source' | 'amountKop'> &
  Partial<Pick<BudgetEntry, 'projectId' | 'title' | 'nickname'>>;

const OPTIONAL_FIELDS = ['projectId', 'title', 'nickname'] as const;

const usesTitle = (source: INCOME_SOURCE) =>
  source === INCOME_SOURCE.ORDER || source === INCOME_SOURCE.PROJECT_JAR;

@Injectable()
export class BudgetService {
  constructor(
    @Inject('BUDGET_ENTRY_MODEL')
    private readonly entryModel: Model<BudgetEntry>,
    private readonly auditService: BudgetAuditService,
    private readonly tracksService: TrackService,
    private readonly projectsService: ProjectsService,
  ) {}

  async getSummary(): Promise<BudgetSummary> {
    const [entries, crumbs] = await Promise.all([
      this.loadGroups(),
      this.tracksService.getCoinsBySeason(),
    ]);

    return summarize(entries, crumbs, todayInKyiv());
  }

  async findEntries({
    page,
    perPage,
    season,
    year,
  }: EntriesQueryData): Promise<Paged<BudgetEntry>> {
    const filter = season && year ? { season, year } : {};

    const [data, total] = await Promise.all([
      this.entryModel
        .find(filter)
        .sort({ date: -1, createdAt: -1, _id: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean<BudgetEntry[]>(),
      this.entryModel.countDocuments(filter),
    ]);

    return { data, page, perPage, total };
  }

  async createIncomes(
    { date, season, year, lines }: CreateIncomesData,
    actor: string,
  ): Promise<BudgetEntry[]> {
    this.assertNotFuture(date);

    const names = await this.projectNames(lines);
    const entries: BudgetEntry[] = lines.map((line) => ({
      _id: new Types.ObjectId(),
      type: ENTRY_TYPE.INCOME,
      ...this.toFields(line, names),
      date,
      season,
      year,
      createdBy: actor,
    }));

    const balances = balancesOf(await this.loadGroups());

    await this.entryModel.insertMany(entries);

    const operation = this.auditService.operation(
      AUDIT_KIND.INCOME_CREATED,
      actor,
      `Додано надходження: ${entries.map((entry) => describeEntry(entry)).join('; ')}`,
    );

    await this.auditService.save(
      entries.flatMap((entry) =>
        this.rowsOf(
          operation,
          entry,
          null,
          snapshotOf(entry),
          effectsOf(entry),
          balances,
        ),
      ),
    );

    return entries;
  }

  async updateEntry(
    id: string,
    { date, season, year, ...line }: UpdateIncomeData,
    actor: string,
  ): Promise<BudgetEntry> {
    const existing = await this.findEntry(id);

    this.assertNotFuture(date);

    const fields = this.toFields(
      line,
      await this.projectNames([line], existing),
    );
    const unset = Object.fromEntries(
      OPTIONAL_FIELDS.filter((field) => !(field in fields)).map((field) => [
        field,
        '',
      ]),
    );
    const balances = balancesOf(await this.loadGroups());

    const updated = await this.entryModel
      .findByIdAndUpdate(
        existing._id,
        {
          $set: { ...fields, date, season, year, updatedBy: actor },
          ...(Object.keys(unset).length && { $unset: unset }),
        },
        { new: true },
      )
      .lean<BudgetEntry>();

    const before = snapshotOf(existing);
    const after = snapshotOf(updated);
    const operation = this.auditService.operation(
      AUDIT_KIND.INCOME_UPDATED,
      actor,
      `Змінено надходження: ${describeEntry(before)} → ${describeEntry(after)}`,
    );

    await this.auditService.save(
      this.rowsOf(
        operation,
        updated,
        before,
        after,
        diffEffects(effectsOf(before), effectsOf(after)),
        balances,
      ),
    );

    return updated;
  }

  async deleteEntry(id: string, actor: string): Promise<boolean> {
    const existing = await this.findEntry(id);
    const balances = balancesOf(await this.loadGroups());

    await this.entryModel.deleteOne({ _id: existing._id });

    const before = snapshotOf(existing);
    const operation = this.auditService.operation(
      AUDIT_KIND.INCOME_DELETED,
      actor,
      `Видалено надходження: ${describeEntry(before)}`,
    );

    await this.auditService.save(
      this.rowsOf(
        operation,
        existing,
        before,
        null,
        negate(effectsOf(before)),
        balances,
      ),
    );

    return true;
  }

  private async projectNames(
    lines: Pick<IncomeLineData, 'source' | 'projectId'>[],
    stored?: BudgetEntry,
  ) {
    const ids = new Set(
      lines.flatMap(({ source, projectId }) =>
        usesTitle(source) && projectId ? [projectId] : [],
      ),
    );
    const names = new Map<string, string>();

    await Promise.all(
      [...ids].map(async (id) => {
        names.set(id, await this.nameOf(id, stored));
      }),
    );

    return names;
  }

  // A project can be deleted after a record was made for it. The record
  // keeps the name it already has, or it could never be edited again.
  private async nameOf(id: string, stored?: BudgetEntry) {
    try {
      return await this.projectsService.findName(id);
    } catch (error) {
      if (
        error instanceof NotFoundException &&
        stored?.projectId === id &&
        stored.title
      ) {
        return stored.title;
      }

      throw error;
    }
  }

  private toFields(
    line: IncomeLineData,
    names: Map<string, string>,
  ): IncomeFields {
    const { source, amountKop } = line;
    const hasTitle = usesTitle(source);
    const projectId = hasTitle ? line.projectId || undefined : undefined;
    const title = projectId
      ? names.get(projectId)
      : hasTitle
        ? line.title || undefined
        : undefined;
    const nickname =
      source === INCOME_SOURCE.LISODAR ? line.nickname || undefined : undefined;

    return {
      source,
      amountKop,
      ...(projectId && { projectId }),
      ...(title && { title }),
      ...(nickname && { nickname }),
    };
  }

  private rowsOf(
    operation: OperationHead,
    entry: BudgetEntry,
    before: EntrySnapshot | null,
    after: EntrySnapshot | null,
    effects: Effect[],
    balances: Map<string, number>,
  ): NewAuditRow[] {
    return effects.map(({ kind, key, label, deltaKop }) => {
      const balanceAfterKop = (balances.get(key) ?? 0) + deltaKop;

      balances.set(key, balanceAfterKop);

      return {
        ...operation,
        unit: AUDIT_UNIT.MONEY,
        subjectKind: kind,
        subjectKey: key,
        subjectLabel: label,
        deltaKop,
        balanceAfterKop,
        season: entry.season,
        year: entry.year,
        entryId: String(entry._id),
        before,
        after,
      };
    });
  }

  private assertNotFuture(date: string) {
    if (date > todayInKyiv()) {
      throw new BadRequestException('Дата не може бути в майбутньому');
    }
  }

  // The sums need only what the effects depend on, so the database counts
  // equal entries instead of sending every record.
  private async loadGroups(): Promise<EntryGroup[]> {
    const groups = await this.entryModel.aggregate<{
      _id: EntryFacts;
      count: number;
    }>([
      {
        $group: {
          _id: {
            source: '$source',
            amountKop: '$amountKop',
            season: '$season',
            year: '$year',
            projectId: '$projectId',
            title: '$title',
            nickname: '$nickname',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    return groups.map(({ _id, count }) => ({ ..._id, count }));
  }

  private async findEntry(id: string): Promise<BudgetEntry> {
    if (!isValidObjectId(id)) throw new BadRequestException('Невірний id');

    const entry = await this.entryModel.findById(id).lean<BudgetEntry>();

    if (!entry) throw new NotFoundException('Запис не знайдено');

    return entry;
  }
}
