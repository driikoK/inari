import { create } from 'zustand';
import axios from '@/api';
import type {
  AUDIT_KIND,
  AUDIT_UNIT,
  ENTRY_TYPE,
  EXPENSE_KIND,
  EXPENSE_SECTION,
  INCOME_SOURCE,
  REQUEST_STATUS,
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
  crumbs?: number;
  coefficient?: number;
  crumbSeason?: string;
  crumbYear?: number;
  requestId?: string;
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

export interface WithdrawalPart {
  season: string;
  year: number;
  crumbs: number;
  coefficient: number;
  amountKop: number;
}

export interface SeasonShare {
  season: string;
  year: number;
  crumbs: number;
  coefficient: number;
}

// What a line would be paid at the rates of now. The sums are fixed when the admin fulfils it.
export interface RequestEstimate {
  amountKop: number;
  parts: WithdrawalPart[];
}

// One line of a request: a card, a donation or a gift to the team. A card number comes whole
// only to the admin and only while the line is open.
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
  createdAt?: string;
  closedAt?: string;
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

export interface RequestLinePayload {
  kind: EXPENSE_KIND;
  crumbs: number | null;
  amountKop: number | null;
  requisite: string | null;
}

export interface RequestPayload {
  isOrder: boolean;
  projectId: string | null;
  title: string | null;
  comment: string | null;
  lines: RequestLinePayload[];
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
  crumbs?: number;
  coefficient?: number;
  crumbSeason?: string;
  crumbYear?: number;
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
  withdrawal: MyWithdrawal | null;
  queue: RequestView[] | null;
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
  getWithdrawal: () => Promise<void>;
  previewRequest: (payload: RequestPayload) => Promise<RequestPreview>;
  createRequest: (payload: RequestPayload) => Promise<void>;
  cancelRequest: (id: string) => Promise<void>;
  getQueue: () => Promise<void>;
  fulfilRequest: (id: string, amountKop: number | null) => Promise<void>;
  rejectRequest: (id: string) => Promise<void>;
  clearEntries: () => void;
  clearAudit: () => void;
  clearQueue: () => void;
}

const defaultPath = '/budget';

let latestEntriesRequest = 0;
let latestAuditRequest = 0;
let latestQueueRequest = 0;

const useBudgetStore = create<State & Actions>((set, get) => {
  const fetchSummary = async () => {
    const response = ensure(await axios.get<BudgetSummary>(`${defaultPath}/summary`));

    set({ summary: response.data });
  };

  const refresh = async () => {
    const { entriesParams, auditParams, withdrawal, queue } = get();
    const { getEntries, getAudit, getWithdrawal, getQueue } = get();

    await Promise.all([
      fetchSummary(),
      entriesParams && getEntries(entriesParams),
      auditParams && getAudit(auditParams),
      withdrawal && getWithdrawal(),
      queue && getQueue(),
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
    withdrawal: null,
    queue: null,

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

    getWithdrawal: async () => {
      const response = ensure(await axios.get<MyWithdrawal>(`${defaultPath}/requests/mine`));

      set({ withdrawal: response.data });
    },

    previewRequest: async (payload) =>
      ensure(await axios.post<RequestPreview>(`${defaultPath}/requests/preview`, payload)).data,

    createRequest: (payload) => change(() => axios.post(`${defaultPath}/requests`, payload)),

    cancelRequest: (id) => change(() => axios.post(`${defaultPath}/requests/${id}/cancel`)),

    getQueue: async () => {
      const request = ++latestQueueRequest;
      const response = ensure(await axios.get<RequestView[]>(`${defaultPath}/requests`));

      if (request === latestQueueRequest) set({ queue: response.data });
    },

    fulfilRequest: (id, amountKop) =>
      change(() => axios.post(`${defaultPath}/requests/${id}/fulfil`, { amountKop })),

    rejectRequest: (id) => change(() => axios.post(`${defaultPath}/requests/${id}/reject`)),

    clearEntries: () => {
      latestEntriesRequest++;

      set({ entries: null, entriesParams: null });
    },

    clearAudit: () => {
      latestAuditRequest++;

      set({ audit: null, auditParams: null });
    },

    clearQueue: () => {
      latestQueueRequest++;

      set({ queue: null });
    },
  };
});

export default useBudgetStore;
