import type { Types } from 'mongoose';
import type { SEASON } from '../../shared/index.js';
import type { SeasonCoins } from '../../tracks/interfaces/track.interface.js';
import type {
  AUDIT_KIND,
  AUDIT_UNIT,
  ENTRY_TYPE,
  EXPENSE_KIND,
  EXPENSE_SECTION,
  INCOME_SOURCE,
  RECONCILE_CHECK,
  RECONCILE_STATUS,
  REQUEST_STATUS,
  SIDE_KIND,
  SUPPORT_DIRECTION,
} from '../enums/index.js';

interface EntryBase {
  _id: Types.ObjectId | string;
  amountKop: number;
  date: string;
  season: SEASON;
  year: number;
  createdBy: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IncomeEntry extends EntryBase {
  type: ENTRY_TYPE.INCOME;
  source: INCOME_SOURCE;
  projectId?: string;
  title?: string;
  nickname?: string;
}

// The amount is signed: a negative one takes money back from a direction
export interface AllocationEntry extends EntryBase {
  type: ENTRY_TYPE.ALLOCATION;
  direction: SUPPORT_DIRECTION;
}

// A payout of crumbs is charged to the jar of the season the crumbs were earned in
// (crumbSeason), while `season` is, as for every payout, the season of its date
export interface ExpenseEntry extends EntryBase {
  type: ENTRY_TYPE.EXPENSE;
  kind: EXPENSE_KIND;
  section: EXPENSE_SECTION;
  direction?: SUPPORT_DIRECTION;
  projectId?: string;
  title?: string;
  nickname: string;
  requisite?: string;
  comment?: string;
  crumbs?: number;
  coefficient?: number;
  crumbSeason?: SEASON;
  crumbYear?: number;
  requestId?: string;
}

export type BudgetEntry = IncomeEntry | AllocationEntry | ExpenseEntry;

// What a record is worth to the sums, without its identity, its date or who made it
export type EntryFacts =
  | Pick<
      IncomeEntry,
      | 'type'
      | 'source'
      | 'amountKop'
      | 'season'
      | 'year'
      | 'projectId'
      | 'title'
      | 'nickname'
    >
  | Pick<
      AllocationEntry,
      'type' | 'direction' | 'amountKop' | 'season' | 'year'
    >
  | Pick<
      ExpenseEntry,
      | 'type'
      | 'kind'
      | 'section'
      | 'direction'
      | 'amountKop'
      | 'season'
      | 'year'
      | 'projectId'
      | 'title'
      | 'nickname'
      | 'crumbSeason'
      | 'crumbYear'
    >;

export type EntrySnapshot = EntryFacts & {
  date: string;
  requisite?: string;
  comment?: string;
  crumbs?: number;
  coefficient?: number;
};

// Entries that share every field the sums depend on, with how many there are
// and the latest date among them. A plain entry counts as one.
export type EntryGroup = EntryFacts & { count?: number; lastDate?: string };

// One record that an operation creates, changes or removes, with what it does
// to the sides of the budget
export interface Change {
  entry: BudgetEntry;
  before: EntrySnapshot | null;
  after: EntrySnapshot | null;
  effects: Effect[];
}

// A jar belongs to a season, which is not always the season of the record
export interface Effect {
  kind: SIDE_KIND;
  key: string;
  label: string;
  deltaKop: number;
  season?: SEASON;
  year?: number;
}

// The hryvnias a crumb of a season is worth, `null` while nothing was earned in it
export interface SeasonRate {
  season: SEASON;
  year: number;
  coefficient: number | null;
}

export interface SourceLine {
  source: INCOME_SOURCE;
  kop: number;
}

// A category of the top of expenses: the crumbs paid out, the orders, or a direction
export interface ExpenseLine {
  category: 'crumbs' | 'orders' | SUPPORT_DIRECTION;
  kop: number;
}

export interface SeasonSummary {
  season: SEASON;
  year: number;
  isCurrent: boolean;
  incomeKop: number;
  transfersKop: number;
  supportKop: number;
  ordersKop: number;
  payoutsKop: number;
  jarKop: number;
  crumbs: number;
  coefficient: number | null;
  treatsKop: number;
  lisodariKop: number;
  sources: SourceLine[];
  expenses: ExpenseLine[];
}

export interface SupportLine {
  direction: SUPPORT_DIRECTION;
  allocatedKop: number;
  spentKop: number;
  balanceKop: number;
}

// What a new set of budgets would do, without writing anything
export interface SupportMove {
  direction: SUPPORT_DIRECTION;
  nowKop: number;
  targetKop: number;
  deltaKop: number;
}

export interface SupportPreview {
  moves: SupportMove[];
  takenKop: number;
  jarKop: number;
  jarAfterKop: number;
  problem: string | null;
}

export interface TitleLine {
  key: string;
  title: string;
  projectId?: string;
  receivedKop: number;
  spentKop: number;
  balanceKop: number;
}

export interface TreatLine {
  key: string;
  title: string;
  projectId?: string;
  kop: number;
}

export interface LisodarLine {
  key: string;
  name: string;
  kop: number;
}

export interface BudgetSummary {
  today: string;
  seasons: SeasonSummary[];
  confectioneryKop: number;
  supportKop: number;
  ordersKop: number;
  treatsKop: number;
  lisodariKop: number;
  supportAllocatedKop: number;
  supportSpentKop: number;
  ordersReceivedKop: number;
  ordersSpentKop: number;
  support: SupportLine[];
  orders: TitleLine[];
  treats: TreatLine[];
  lisodari: LisodarLine[];
}

// Crumbs of one season that are paid out, at the coefficient of that season
export interface WithdrawalPart {
  season: SEASON;
  year: number;
  crumbs: number;
  coefficient: number;
  amountKop: number;
}

export interface SeasonShare {
  season: SEASON;
  year: number;
  crumbs: number;
  coefficient: number;
}

// One line of a request: a card, a donation or a gift to the development of the
// team. Crumbs come off the nickname unless the line is for an order, which is
// paid in hryvnias out of the budget of a title.
export interface WithdrawalRequest {
  _id: Types.ObjectId | string;
  status: REQUEST_STATUS;
  username: string;
  nickname: string;
  groupId: string;
  kind: EXPENSE_KIND;
  isOrder: boolean;
  crumbs?: number;
  amountKop?: number;
  projectId?: string;
  title?: string;
  requisite?: string;
  comment?: string;
  closedAt?: Date;
  closedBy?: string;
  closedDay?: string;
  paidKop?: number;
  parts?: WithdrawalPart[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RequestEstimate {
  amountKop: number;
  parts: WithdrawalPart[];
}

export interface RequestView {
  _id: string;
  groupId: string;
  status: REQUEST_STATUS;
  username: string;
  nickname: string;
  kind: EXPENSE_KIND;
  isOrder: boolean;
  crumbs?: number;
  amountKop?: number;
  projectId?: string;
  title?: string;
  requisite?: string;
  comment?: string;
  createdAt?: Date;
  closedAt?: Date;
  closedBy?: string;
  paidKop?: number;
  parts?: WithdrawalPart[];
  estimate: RequestEstimate | null;
  problem: string | null;
}

export interface WithdrawalInfo {
  nickname: string | null;
  balance: number;
  reservedCrumbs: number;
  availableCrumbs: number;
  lockedCrumbs: number;
  shares: SeasonShare[];
}

export interface MyWithdrawal extends WithdrawalInfo {
  requests: RequestView[];
}

export interface PreviewLine {
  kind: EXPENSE_KIND;
  crumbs?: number;
  amountKop?: number;
  estimate: RequestEstimate | null;
}

export interface RequestPreview {
  info: WithdrawalInfo;
  lines: PreviewLine[];
  problem: string | null;
}

export interface TrackSnapshot {
  type: 'track';
  nickname: string;
  nameTitle: string;
  currentEpisode: number;
  typeRole: string;
  season: SEASON;
  year: number;
  coins: number;
}

export interface MemberSnapshot {
  type: 'member';
  nickname: string;
  coins: number;
  seasons: SeasonCoins[];
}

export type CrumbSnapshot = TrackSnapshot | MemberSnapshot;

export interface AuditRowBase {
  operationId: string;
  seq: number;
  at: Date;
  day: string;
  kind: AUDIT_KIND;
  actor: string;
  operationDescription: string;
  subjectKind: SIDE_KIND;
  subjectKey: string;
  subjectLabel: string;
  season: SEASON;
  year: number;
}

export interface MoneyAuditRow extends AuditRowBase {
  unit: AUDIT_UNIT.MONEY;
  deltaKop: number;
  balanceAfterKop: number;
  entryId: string;
  before: EntrySnapshot | null;
  after: EntrySnapshot | null;
}

export interface CrumbAuditRow extends AuditRowBase {
  unit: AUDIT_UNIT.CRUMBS;
  deltaCrumbs: number;
  balanceAfterCrumbs: number;
  seasonBalanceAfterCrumbs: number;
  entryId?: string;
  before: CrumbSnapshot | null;
  after: CrumbSnapshot | null;
}

export type OperationHead = Pick<
  AuditRowBase,
  'operationId' | 'at' | 'day' | 'kind' | 'actor' | 'operationDescription'
>;

export type AuditRow = MoneyAuditRow | CrumbAuditRow;

export type NewAuditRow =
  | Omit<MoneyAuditRow, 'seq'>
  | Omit<CrumbAuditRow, 'seq'>;

export type OperationRow =
  | Omit<MoneyAuditRow, 'operationId' | 'operationDescription'>
  | Omit<CrumbAuditRow, 'operationId' | 'operationDescription'>;

export interface AuditOperation {
  operationId: string;
  at: Date;
  day: string;
  kind: AUDIT_KIND;
  actor: string;
  description: string;
  rows: OperationRow[];
}

export interface Paged<T> {
  data: T[];
  page: number;
  perPage: number;
  total: number;
}

// What the rows of the audit add up to, for one side of the money or for one
// nickname and one kind of operation
export interface MoneyAuditSum {
  key: string;
  label: string;
  kop: number;
  rows: number;
}

export interface CrumbAuditSum {
  key: string;
  kind: AUDIT_KIND;
  crumbs: number;
  rows: number;
}

// What the reconciliation found. A number is kopiykas or crumbs, as `unit` says,
// and the difference is the actual minus the expected.
export interface ReconcileProblem {
  severity: RECONCILE_STATUS.WARNING | RECONCILE_STATUS.ERROR;
  subject: string;
  message: string;
  unit?: AUDIT_UNIT;
  expected?: number;
  actual?: number;
  difference?: number;
}

export interface ReconcileCheck {
  key: RECONCILE_CHECK;
  title: string;
  description: string;
  status: RECONCILE_STATUS;
  // `problems` holds only the first ones, this is how many there are
  total: number;
  problems: ReconcileProblem[];
}

export interface ReconcileReport {
  checkedAt: Date;
  status: RECONCILE_STATUS;
  counts: {
    entries: number;
    auditRows: number;
    members: number;
    requests: number;
  };
  checks: ReconcileCheck[];
  // Nicknames with crumbs whose opening state is not in the audit yet
  unaudited: string[];
}

export interface OpeningResult {
  written: string[];
}
