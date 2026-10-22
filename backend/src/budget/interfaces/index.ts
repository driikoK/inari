import type { Types } from 'mongoose';
import type { SEASON } from '../../shared/index.js';
import type { SeasonCoins } from '../../tracks/interfaces/track.interface.js';
import type {
  AUDIT_KIND,
  AUDIT_UNIT,
  ENTRY_TYPE,
  INCOME_SOURCE,
  SIDE_KIND,
} from '../enums/index.js';

export interface BudgetEntry {
  _id: Types.ObjectId | string;
  type: ENTRY_TYPE;
  source: INCOME_SOURCE;
  amountKop: number;
  date: string;
  season: SEASON;
  year: number;
  projectId?: string;
  title?: string;
  nickname?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type EntrySnapshot = Pick<
  BudgetEntry,
  | 'source'
  | 'amountKop'
  | 'date'
  | 'season'
  | 'year'
  | 'projectId'
  | 'title'
  | 'nickname'
>;

export type EntryFacts = Omit<EntrySnapshot, 'date'>;

// Entries that share every field the sums depend on, with how many there are.
// A plain entry counts as one.
export type EntryGroup = EntryFacts & { count?: number };

export interface Effect {
  kind: SIDE_KIND;
  key: string;
  label: string;
  deltaKop: number;
}

export interface SeasonSummary {
  season: SEASON;
  year: number;
  isCurrent: boolean;
  incomeKop: number;
  supportKop: number;
  ordersKop: number;
  payoutsKop: number;
  jarKop: number;
  crumbs: number;
  coefficient: number | null;
  treatsKop: number;
  lisodariKop: number;
}

export interface BudgetSummary {
  today: string;
  seasons: SeasonSummary[];
  confectioneryKop: number;
  supportKop: number;
  ordersKop: number;
  treatsKop: number;
  lisodariKop: number;
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
