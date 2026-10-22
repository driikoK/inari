import { create } from 'zustand';
import axios from '@/api';
import type {
  AUDIT_KIND,
  AUDIT_UNIT,
  ENTRY_TYPE,
  EXPENSE_KIND,
  EXPENSE_SECTION,
  INCOME_SOURCE,
  SUPPORT_DIRECTION,
} from '@/types';
import { ensure } from '@/utils/request';

export interface SourceLine {
  source: INCOME_SOURCE;
  kop: number;
}

export interface ExpenseLine {
  category: 'crumbs' | 'orders' | SUPPORT_DIRECTION;
  kop: number;
}

export interface BudgetSeasonSummary {
  season: string;
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
  seasons: BudgetSeasonSummary[];
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

interface EntryBase {
  _id: string;
  amountKop: number;
  date: string;
  season: string;
  year: number;
  createdBy: string;
  updatedBy?: string;
}

export interface IncomeEntry extends EntryBase {
  type: ENTRY_TYPE.INCOME;
  source: INCOME_SOURCE;
  projectId?: string;
  title?: string;
  nickname?: string;
}

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

export interface Paged<T> {
  data: T[];
  page: number;
  perPage: number;
  total: number;
}

export interface EntriesParams {
  page: number;
  perPage: number;
  season?: string;
  year?: number;
  type?: ENTRY_TYPE;
}

export interface IncomeLinePayload {
  source: INCOME_SOURCE;
  amountKop: number;
  projectId: string | null;
  title: string | null;
  nickname: string | null;
}

export interface IncomesPayload {
  date: string;
  season: string;
  year: number;
  lines: IncomeLinePayload[];
}

export type IncomePayload = Omit<IncomesPayload, 'lines'> & IncomeLinePayload;

export interface ExpenseLinePayload {
  kind: EXPENSE_KIND;
  amountKop: number;
  section: EXPENSE_SECTION;
  direction: SUPPORT_DIRECTION | null;
  projectId: string | null;
  title: string | null;
  nickname: string;
  requisite: string | null;
}

export interface ExpensesPayload {
  date: string;
  comment: string | null;
  lines: ExpenseLinePayload[];
}

export type ExpensePayload = Omit<ExpensesPayload, 'lines'> & ExpenseLinePayload;

export interface SupportPayload {
  date: string;
  season: string;
  year: number;
  targets: { direction: SUPPORT_DIRECTION; targetKop: number }[];
}

export interface SupportMove {
  direction: SUPPORT_DIRECTION;
  nowKop: number;
  targetKop: number;
  deltaKop: number;
}

// What the server says new support budgets would do, before they are saved
export interface SupportPreview {
  moves: SupportMove[];
  takenKop: number;
  jarKop: number;
  jarAfterKop: number;
  problem: string | null;
}

// Records audited before the other kinds existed have no type: they are incomes
export interface IncomeSnapshot {
  type?: ENTRY_TYPE.INCOME;
  source: INCOME_SOURCE;
  amountKop: number;
  date: string;
  season: string;
  year: number;
  projectId?: string;
  title?: string;
  nickname?: string;
}

export interface AllocationSnapshot {
  type: ENTRY_TYPE.ALLOCATION;
  direction: SUPPORT_DIRECTION;
  amountKop: number;
  date: string;
  season: string;
  year: number;
}

export interface ExpenseSnapshot {
  type: ENTRY_TYPE.EXPENSE;
  kind: EXPENSE_KIND;
  section: EXPENSE_SECTION;
  direction?: SUPPORT_DIRECTION;
  amountKop: number;
  date: string;
  season: string;
  year: number;
  projectId?: string;
  title?: string;
  nickname: string;
  requisite?: string;
  comment?: string;
}

export type AuditSnapshot = IncomeSnapshot | AllocationSnapshot | ExpenseSnapshot;

export interface TrackSnapshot {
  type: 'track';
  nickname: string;
  nameTitle: string;
  currentEpisode: number;
  typeRole: string;
  season: string;
  year: number;
  coins: number;
}

export interface MemberSnapshot {
  type: 'member';
  nickname: string;
  coins: number;
  seasons: { season: string; year: number; coins: number }[];
}

export type CrumbSnapshot = TrackSnapshot | MemberSnapshot;

interface AuditRowBase {
  seq: number;
  subjectKind: string;
  subjectKey: string;
  subjectLabel: string;
  season: string;
  year: number;
}

export interface MoneyAuditRow extends AuditRowBase {
  unit: AUDIT_UNIT.MONEY;
  deltaKop: number;
  balanceAfterKop: number;
  entryId: string;
  before: AuditSnapshot | null;
  after: AuditSnapshot | null;
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

export type AuditRow = MoneyAuditRow | CrumbAuditRow;

export interface AuditOperation {
  operationId: string;
  at: string;
  day: string;
  kind: AUDIT_KIND;
  actor: string;
  description: string;
  rows: AuditRow[];
}

export interface AuditParams {
  page: number;
  perPage: number;
  from?: string;
  to?: string;
  season?: string;
  year?: number;
  kind?: AUDIT_KIND;
  search?: string;
}

interface State {
  summary: BudgetSummary | null;
  isSummaryLoading: boolean;
  entries: Paged<BudgetEntry> | null;
  entriesParams: EntriesParams | null;
  audit: Paged<AuditOperation> | null;
  auditParams: AuditParams | null;
}

interface Actions {
  getSummary: () => Promise<void>;
  getEntries: (params: EntriesParams) => Promise<void>;
  getAudit: (params: AuditParams) => Promise<void>;
  createIncomes: (payload: IncomesPayload) => Promise<void>;
  updateEntry: (id: string, payload: IncomePayload) => Promise<void>;
  createExpenses: (payload: ExpensesPayload) => Promise<void>;
  updateExpense: (id: string, payload: ExpensePayload) => Promise<void>;
  updateSupport: (payload: SupportPayload) => Promise<void>;
  previewSupport: (payload: SupportPayload) => Promise<SupportPreview>;
  deleteEntry: (id: string) => Promise<void>;
  clearEntries: () => void;
  clearAudit: () => void;
}

const defaultPath = '/budget';

let latestEntriesRequest = 0;
let latestAuditRequest = 0;

const useBudgetStore = create<State & Actions>((set, get) => {
  const fetchSummary = async () => {
    const response = ensure(await axios.get<BudgetSummary>(`${defaultPath}/summary`));

    set({ summary: response.data });
  };

  const refresh = async () => {
    const { entriesParams, auditParams, getEntries, getAudit } = get();

    await Promise.all([
      fetchSummary(),
      entriesParams && getEntries(entriesParams),
      auditParams && getAudit(auditParams),
    ]);
  };

  // The server saves the record before it writes the audit, so a failed request may still have
  // changed the numbers. Refetch either way and let the caller see the original error.
  const change = async (request: () => Promise<unknown>) => {
    try {
      ensure(await request());
    } finally {
      await refresh().catch(() => undefined);
    }
  };

  return {
    summary: null,
    isSummaryLoading: true,
    entries: null,
    entriesParams: null,
    audit: null,
    auditParams: null,

    getSummary: async () => {
      set({ isSummaryLoading: true });

      try {
        await fetchSummary();
      } finally {
        set({ isSummaryLoading: false });
      }
    },

    getEntries: async (params) => {
      const request = ++latestEntriesRequest;

      set({ entriesParams: params });

      const response = ensure(
        await axios.get<Paged<BudgetEntry>>(`${defaultPath}/entries`, { params }),
      );

      if (request === latestEntriesRequest) set({ entries: response.data });
    },

    getAudit: async (params) => {
      const request = ++latestAuditRequest;

      set({ auditParams: params });

      const response = ensure(
        await axios.get<Paged<AuditOperation>>(`${defaultPath}/audit`, { params }),
      );

      if (request === latestAuditRequest) set({ audit: response.data });
    },

    createIncomes: (payload) => change(() => axios.post(`${defaultPath}/incomes`, payload)),

    updateEntry: (id, payload) => change(() => axios.put(`${defaultPath}/entries/${id}`, payload)),

    createExpenses: (payload) => change(() => axios.post(`${defaultPath}/expenses`, payload)),

    updateExpense: (id, payload) =>
      change(() => axios.put(`${defaultPath}/expenses/${id}`, payload)),

    updateSupport: (payload) => change(() => axios.put(`${defaultPath}/support`, payload)),

    previewSupport: async (payload) =>
      ensure(await axios.post<SupportPreview>(`${defaultPath}/support/preview`, payload)).data,

    deleteEntry: (id) => change(() => axios.delete(`${defaultPath}/entries/${id}`)),

    clearEntries: () => {
      latestEntriesRequest++;

      set({ entries: null, entriesParams: null });
    },

    clearAudit: () => {
      latestAuditRequest++;

      set({ audit: null, auditParams: null });
    },
  };
});

export default useBudgetStore;
