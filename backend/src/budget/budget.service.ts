import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isValidObjectId, Model, Types } from 'mongoose';
import { ProjectsService } from '../projects/projects.service.js';
import { seasonOfDay, todayInKyiv } from '../projects/layout.js';
import { TrackService } from '../tracks/tracks.service.js';
import { BudgetAuditService } from './budget-audit.service.js';
import { keepRequisite } from './card.js';
import {
  balancesOf,
  created,
  describeEntry,
  diffEffects,
  effectsOf,
  findOverdraft,
  formatKop,
  jarKey,
  negate,
  overdraftMessage,
  snapshotOf,
  typeOf,
} from './calc.js';
import type {
  CreateExpensesData,
  CreateIncomesData,
  EntriesQueryData,
  ExpenseLineData,
  IncomeLineData,
  UpdateExpenseData,
  UpdateIncomeData,
  UpdateSupportData,
} from './data/index.js';
import {
  AUDIT_KIND,
  AUDIT_UNIT,
  DIRECTION_LABEL,
  ENTRY_TYPE,
  EXPENSE_KIND,
  EXPENSE_SECTION,
  INCOME_SOURCE,
} from './enums/index.js';
import type {
  AllocationEntry,
  BudgetEntry,
  BudgetSummary,
  Change,
  Effect,
  EntryFacts,
  EntryGroup,
  EntrySnapshot,
  ExpenseEntry,
  IncomeEntry,
  NewAuditRow,
  OperationHead,
  Paged,
  SeasonRate,
  SupportMove,
  SupportPreview,
  TitleLine,
} from './interfaces/index.js';
import { orderBudgets, seasonRates, summarize } from './summary.js';

type IncomeFields = Pick<IncomeEntry, 'source' | 'amountKop'> &
  Partial<Pick<IncomeEntry, 'projectId' | 'title' | 'nickname'>>;

type ExpenseFields = Pick<
  ExpenseEntry,
  'kind' | 'section' | 'amountKop' | 'nickname'
> &
  Partial<
    Pick<
      ExpenseEntry,
      'direction' | 'projectId' | 'title' | 'requisite' | 'comment'
    >
  >;

type Titled = { projectId?: string; title?: string };

interface CommitOptions<R> {
  // The balances the caller has just read, so they are not read twice
  known?: Map<string, number>;
  // Rows of the same operation that are not about money, such as the crumbs
  // that came off a nickname
  extraRows?: (head: OperationHead, saved: R) => NewAuditRow[];
}

// Where the name of a project comes from when it is no longer in Projects:
// the record being edited, or the budget the money is already in
interface NameSource {
  stored?: Titled;
  fromBudget?: boolean;
}

const INCOME_OPTIONAL = ['projectId', 'title', 'nickname'] as const;
const EXPENSE_OPTIONAL = [
  'direction',
  'projectId',
  'title',
  'requisite',
  'comment',
] as const;

const usesTitle = (source: INCOME_SOURCE) =>
  source === INCOME_SOURCE.ORDER || source === INCOME_SOURCE.PROJECT_JAR;

const DELETED: Record<ENTRY_TYPE, [AUDIT_KIND, string]> = {
  [ENTRY_TYPE.INCOME]: [AUDIT_KIND.INCOME_DELETED, 'надходження'],
  [ENTRY_TYPE.ALLOCATION]: [AUDIT_KIND.ALLOCATION_DELETED, 'виділення'],
  [ENTRY_TYPE.EXPENSE]: [AUDIT_KIND.EXPENSE_DELETED, 'частування'],
};

const UPDATES = {
  [ENTRY_TYPE.INCOME]: {
    notIt: 'Цей запис не є надходженням',
    kind: AUDIT_KIND.INCOME_UPDATED,
    title: 'Змінено надходження',
    optional: INCOME_OPTIONAL,
  },
  [ENTRY_TYPE.EXPENSE]: {
    notIt: 'Цей запис не є частуванням',
    kind: AUDIT_KIND.EXPENSE_UPDATED,
    title: 'Змінено частування',
    optional: EXPENSE_OPTIONAL,
  },
} as const;

type Updatable = keyof typeof UPDATES;

const unsetOf = (fields: object, optional: readonly string[]) =>
  Object.fromEntries(
    optional.filter((field) => !(field in fields)).map((field) => [field, '']),
  );

const without = <T extends object>(entry: T, keys: readonly string[]): T =>
  Object.fromEntries(
    Object.entries(entry).filter(([key]) => !keys.includes(key)),
  ) as T;

@Injectable()
export class BudgetService {
  // Every write reads the balances and then changes them. The server is one
  // process, so taking turns is enough to keep two writes from both spending
  // the same money.
  private queue: Promise<unknown> = Promise.resolve();

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

  // The coefficient of every season that has crumbs
  async seasonRates(): Promise<SeasonRate[]> {
    const [entries, crumbs] = await Promise.all([
      this.loadGroups(),
      this.tracksService.getCoinsBySeason(),
    ]);

    return seasonRates(entries, crumbs);
  }

  // What a request is checked against, read once: the coefficient of every
  // season and the budgets of the titles
  async requestFacts(): Promise<{ rates: SeasonRate[]; orders: TitleLine[] }> {
    const [entries, crumbs] = await Promise.all([
      this.loadGroups(),
      this.tracksService.getCoinsBySeason(),
    ]);

    return {
      rates: seasonRates(entries, crumbs),
      orders: orderBudgets(entries),
    };
  }

  async findEntries({
    page,
    perPage,
    season,
    year,
    type,
  }: EntriesQueryData): Promise<Paged<BudgetEntry>> {
    // A record from before there were other kinds has no type: it is an income
    const filter = {
      ...(season && year && { season, year }),
      ...(type && {
        type: type === ENTRY_TYPE.INCOME ? { $in: [type, null] } : type,
      }),
    };

    const [data, total] = await Promise.all([
      this.entryModel
        .find(filter)
        .sort({ date: -1, createdAt: -1, _id: -1 })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean<BudgetEntry[]>(),
      this.entryModel.countDocuments(filter),
    ]);

    return {
      data: data.map((row) => ({ ...row, type: typeOf(row) }) as BudgetEntry),
      page,
      perPage,
      total,
    };
  }

  createIncomes(
    { date, season, year, lines }: CreateIncomesData,
    actor: string,
  ): Promise<IncomeEntry[]> {
    return this.exclusive(async () => {
      this.assertNotFuture(date);

      const names = await this.projectNames(
        lines.flatMap(({ source, projectId }) =>
          usesTitle(source) && projectId ? [projectId] : [],
        ),
      );
      const entries: IncomeEntry[] = lines.map((line) => ({
        _id: new Types.ObjectId(),
        type: ENTRY_TYPE.INCOME,
        ...this.incomeFields(line, names),
        date,
        season,
        year,
        createdBy: actor,
      }));

      await this.commit(
        AUDIT_KIND.INCOME_CREATED,
        actor,
        `Додано надходження: ${entries.map((entry) => describeEntry(snapshotOf(entry))).join('; ')}`,
        entries.map(created),
        () => this.entryModel.insertMany(entries),
      );

      return entries;
    });
  }

  updateEntry(
    id: string,
    { date, season, year, ...line }: UpdateIncomeData,
    actor: string,
  ): Promise<IncomeEntry> {
    return this.exclusive(async () => {
      const existing = await this.findForUpdate<IncomeEntry>(
        id,
        ENTRY_TYPE.INCOME,
        date,
      );
      const names = await this.projectNames(
        usesTitle(line.source) && line.projectId ? [line.projectId] : [],
        { stored: existing },
      );

      return this.replace<IncomeEntry>(
        existing,
        ENTRY_TYPE.INCOME,
        { ...this.incomeFields(line, names), date, season, year },
        actor,
      );
    });
  }

  createExpenses(
    { date, comment, lines }: CreateExpensesData,
    actor: string,
  ): Promise<ExpenseEntry[]> {
    return this.exclusive(async () => {
      this.assertNotFuture(date);

      const { season, year } = seasonOfDay(date);
      const names = await this.projectNames(
        lines.flatMap(({ section, projectId }) =>
          section === EXPENSE_SECTION.ORDERS && projectId ? [projectId] : [],
        ),
        { fromBudget: true },
      );
      const entries: ExpenseEntry[] = lines.map((line) => ({
        _id: new Types.ObjectId(),
        type: ENTRY_TYPE.EXPENSE,
        ...this.expenseFields({ ...line, comment }, names),
        date,
        season,
        year,
        createdBy: actor,
      }));

      await this.commit(
        AUDIT_KIND.EXPENSE_CREATED,
        actor,
        `Додано частування: ${entries.map((entry) => describeEntry(snapshotOf(entry))).join('; ')}`,
        entries.map(created),
        () => this.entryModel.insertMany(entries),
      );

      return entries;
    });
  }

  updateExpense(
    id: string,
    { date, ...line }: UpdateExpenseData,
    actor: string,
  ): Promise<ExpenseEntry> {
    return this.exclusive(async () => {
      const existing = await this.findForUpdate<ExpenseEntry>(
        id,
        ENTRY_TYPE.EXPENSE,
        date,
      );

      this.assertNotCrumbPayout(existing);
      const { season, year } = seasonOfDay(date);
      const names = await this.projectNames(
        line.section === EXPENSE_SECTION.ORDERS && line.projectId
          ? [line.projectId]
          : [],
        { stored: existing, fromBudget: true },
      );

      return this.replace<ExpenseEntry>(
        existing,
        ENTRY_TYPE.EXPENSE,
        { ...this.expenseFields(line, names), date, season, year },
        actor,
      );
    });
  }

  // The admin says what each direction should hold, and the difference to what
  // it holds now is taken out of the jar of one season, or put back into it
  updateSupport(
    { date, season, year, targets }: UpdateSupportData,
    actor: string,
  ): Promise<AllocationEntry[]> {
    return this.exclusive(async () => {
      this.assertNotFuture(date);

      const balances = balancesOf(await this.loadGroups());
      const moves = this.supportMoves(targets, balances);

      if (moves.length === 0) {
        throw new BadRequestException('Бюджети напрямків не змінилися');
      }

      const entries = this.allocationsOf(moves, { date, season, year }, actor);

      await this.commit(
        AUDIT_KIND.SUPPORT_UPDATED,
        actor,
        `Змінено Печивко підтримки: ${moves
          .map(
            ({ direction, nowKop, targetKop }) =>
              `${DIRECTION_LABEL[direction]} ${formatKop(nowKop)} → ${formatKop(targetKop)}`,
          )
          .join('; ')}`,
        entries.map(created),
        () => this.entryModel.insertMany(entries),
        { known: balances },
      );

      return entries;
    });
  }

  // What updateSupport would do, so the form can show it before it is saved
  async previewSupport({
    date,
    season,
    year,
    targets,
  }: UpdateSupportData): Promise<SupportPreview> {
    const balances = balancesOf(await this.loadGroups());
    const moves = this.supportMoves(targets, balances);
    const overdraft = findOverdraft(
      balances,
      this.allocationsOf(moves, { date, season, year }, '')
        .map(created)
        .flatMap(({ effects }) => effects),
    );
    const takenKop = moves.reduce((total, { deltaKop }) => total + deltaKop, 0);
    const jarKop = balances.get(jarKey(season, year)) ?? 0;

    return {
      moves,
      takenKop,
      jarKop,
      jarAfterKop: jarKop - takenKop,
      problem: overdraft ? overdraftMessage(overdraft) : null,
    };
  }

  deleteEntry(id: string, actor: string): Promise<boolean> {
    return this.exclusive(async () => {
      const existing = await this.findEntry(id);

      this.assertNotCrumbPayout(existing);

      const before = snapshotOf(existing);
      const [kind, what] = DELETED[typeOf(existing)];

      await this.commit(
        kind,
        actor,
        `Видалено ${what}: ${describeEntry(before)}`,
        [
          {
            entry: existing,
            before,
            after: null,
            effects: negate(effectsOf(before)),
          },
        ],
        () => this.entryModel.deleteOne({ _id: existing._id }),
      );

      return true;
    });
  }

  // A job that reads the balances and then spends them, run when the ones
  // before it are done. Whatever writes money has to go through here.
  exclusive<T>(job: () => Promise<T>): Promise<T> {
    const run = this.queue.then(job, job);

    this.queue = run.catch(() => undefined);

    return run;
  }

  private async findForUpdate<T extends BudgetEntry>(
    id: string,
    type: Updatable,
    date: string,
  ): Promise<T> {
    const existing = await this.findEntry(id);

    if (typeOf(existing) !== type) {
      throw new BadRequestException(UPDATES[type].notIt);
    }

    this.assertNotFuture(date);

    return existing as T;
  }

  // Changes one record in place. The fields that are not in `changes` and are
  // optional for its kind are removed.
  private replace<T extends BudgetEntry>(
    existing: BudgetEntry,
    type: Updatable,
    changes: object,
    actor: string,
  ): Promise<T> {
    const { kind, title, optional } = UPDATES[type];
    const set = { ...changes, updatedBy: actor };
    const unset = unsetOf(changes, optional);
    const next = { ...without(existing, optional), ...set } as BudgetEntry;
    const before = snapshotOf(existing);
    const after = snapshotOf(next);

    return this.commit(
      kind,
      actor,
      `${title}: ${describeEntry(before)} → ${describeEntry(after)}`,
      [
        {
          entry: next,
          before,
          after,
          effects: diffEffects(effectsOf(before), effectsOf(after)),
        },
      ],
      () =>
        this.entryModel
          .findByIdAndUpdate(
            existing._id,
            {
              $set: set,
              ...(Object.keys(unset).length && { $unset: unset }),
            },
            { new: true },
          )
          .lean<T>(),
    ) as Promise<T>;
  }

  // The record is written first and the audit second, as there are no
  // transactions. Nothing may go below zero, so a change that would take more
  // than a side holds is refused before anything is written.
  async commit<R>(
    kind: AUDIT_KIND,
    actor: string,
    description: string,
    changes: Change[],
    persist: () => Promise<R>,
    options: CommitOptions<R> = {},
  ): Promise<R> {
    const balances = options.known ?? balancesOf(await this.loadGroups());
    const overdraft = findOverdraft(
      balances,
      changes.flatMap(({ effects }) => effects),
    );

    if (overdraft) {
      throw new ConflictException(overdraftMessage(overdraft));
    }

    const saved = await persist();
    const operation = this.auditService.operation(kind, actor, description);

    await this.auditService.save([
      ...changes.flatMap(({ entry, before, after, effects }) =>
        this.rowsOf(operation, entry, before, after, effects, balances),
      ),
      ...(options.extraRows?.(operation, saved) ?? []),
    ]);

    return saved;
  }

  insertEntries(entries: BudgetEntry[]) {
    return this.entryModel.insertMany(entries);
  }

  removeByRequest(requestId: string) {
    return this.entryModel.deleteMany({ requestId });
  }

  // The money of a payout of crumbs is tied to the counters of a nickname,
  // which a record of the journal cannot put back
  private assertNotCrumbPayout(entry: BudgetEntry) {
    if (
      entry.type === ENTRY_TYPE.EXPENSE &&
      entry.section === EXPENSE_SECTION.CRUMBS
    ) {
      throw new BadRequestException(
        'Виплату за крихти не можна змінити чи видалити, бо крихти вже зняті з нікнейма',
      );
    }
  }

  private supportMoves(
    targets: UpdateSupportData['targets'],
    balances: Map<string, number>,
  ): SupportMove[] {
    return targets
      .map(({ direction, targetKop }) => {
        const nowKop = balances.get(`support:${direction}`) ?? 0;

        return { direction, nowKop, targetKop, deltaKop: targetKop - nowKop };
      })
      .filter(({ deltaKop }) => deltaKop !== 0);
  }

  private allocationsOf(
    moves: SupportMove[],
    { date, season, year }: Pick<AllocationEntry, 'date' | 'season' | 'year'>,
    actor: string,
  ): AllocationEntry[] {
    return moves.map(({ direction, deltaKop }) => ({
      _id: new Types.ObjectId(),
      type: ENTRY_TYPE.ALLOCATION,
      direction,
      amountKop: deltaKop,
      date,
      season,
      year,
      createdBy: actor,
    }));
  }

  private async projectNames(ids: string[], source: NameSource = {}) {
    const names = new Map<string, string>();

    await Promise.all(
      [...new Set(ids)].map(async (id) => {
        names.set(id, await this.nameOf(id, source));
      }),
    );

    return names;
  }

  // A project can be deleted after a record was made for it. The money in its
  // budget stays, so a record keeps the name it already has, or it could never
  // be edited, and a payout takes the name the budget has.
  private async nameOf(id: string, { stored, fromBudget }: NameSource) {
    try {
      return await this.projectsService.findName(id);
    } catch (error) {
      if (!(error instanceof NotFoundException)) throw error;

      const title =
        stored?.projectId === id && stored.title
          ? stored.title
          : fromBudget
            ? await this.budgetTitle(id)
            : undefined;

      if (title) return title;

      throw error;
    }
  }

  private async budgetTitle(projectId: string) {
    const newest = await this.entryModel
      .findOne({ projectId, title: { $exists: true } })
      .sort({ date: -1, createdAt: -1, _id: -1 })
      .select('title')
      .lean<Titled>();

    return newest?.title;
  }

  private incomeFields(
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

  // The direction belongs to the support budget and the title to the orders,
  // the requisite to a payout, and only its last digits are kept
  private expenseFields(
    line: ExpenseLineData & { comment?: string | null },
    names: Map<string, string>,
  ): ExpenseFields {
    const { kind, section, amountKop, nickname, requisite, comment } = line;
    const isSupport = section === EXPENSE_SECTION.SUPPORT;
    const projectId = !isSupport ? line.projectId || undefined : undefined;
    const title = projectId
      ? names.get(projectId)
      : !isSupport
        ? line.title || undefined
        : undefined;

    return {
      kind,
      section,
      amountKop,
      nickname,
      ...(isSupport && line.direction && { direction: line.direction }),
      ...(projectId && { projectId }),
      ...(title && { title }),
      ...(kind !== EXPENSE_KIND.DEVELOPMENT &&
        requisite && { requisite: keepRequisite(requisite) }),
      ...(comment && { comment }),
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
    return effects.map(({ kind, key, label, deltaKop, season, year }) => {
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
        season: season ?? entry.season,
        year: year ?? entry.year,
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
  async loadGroups(): Promise<EntryGroup[]> {
    const groups = await this.entryModel.aggregate<{
      _id: EntryFacts;
      count: number;
      lastDate: string;
    }>([
      {
        $group: {
          _id: {
            type: { $ifNull: ['$type', ENTRY_TYPE.INCOME] },
            source: '$source',
            kind: '$kind',
            section: '$section',
            direction: '$direction',
            amountKop: '$amountKop',
            season: '$season',
            year: '$year',
            projectId: '$projectId',
            title: '$title',
            nickname: '$nickname',
            crumbSeason: '$crumbSeason',
            crumbYear: '$crumbYear',
          },
          count: { $sum: 1 },
          lastDate: { $max: '$date' },
        },
      },
    ]);

    return groups.map(({ _id, count, lastDate }) => ({
      ..._id,
      count,
      lastDate,
    }));
  }

  private async findEntry(id: string): Promise<BudgetEntry> {
    if (!isValidObjectId(id)) throw new BadRequestException('Невірний id');

    const entry = await this.entryModel.findById(id).lean<BudgetEntry>();

    if (!entry) throw new NotFoundException('Запис не знайдено');

    return entry;
  }
}
