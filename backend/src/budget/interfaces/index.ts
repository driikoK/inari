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
    >;

export type EntrySnapshot = EntryFacts & {
  date: string;
  requisite?: string;
  comment?: string;
};

// Entries that share every field the sums depend on, with how many there are
// and the latest date among them. A plain entry counts as one.
export type EntryGroup = EntryFacts & { count?: number; lastDate?: string };

// A jar belongs to a season, which is not always the season of the record
export interface Effect {
  kind: SIDE_KIND;
  key: string;
  label: string;
  deltaKop: number;
  season?: SEASON;
  year?: number;
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
