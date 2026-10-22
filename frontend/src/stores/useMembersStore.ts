import { create } from 'zustand';
import axios from '@/api';
import { CoinsTotal, MemberKind, MemberType, MyCoins } from '@/types';
import { isObjEmpty, isObjValuesExist } from '@/utils/objects';
import { ensure, notifyFailure } from '@/utils/request';

interface FilterData {
  id: string;
  kind: string;
  season: string;
  year: number;
}

interface CoinsTotalParams {
  season?: string;
  year?: number;
  includeGuests: boolean;
}

interface CoinsTotalAnswer extends CoinsTotal {
  params: CoinsTotalParams;
}

interface State {
  members: MemberType[];
  membersDictionary: MemberType[];
  appliedFilters: Partial<FilterData>;
  coinsTotal: CoinsTotalAnswer | null;
  coinsTotalParams: CoinsTotalParams | null;
  isCoinsTotalLoading: boolean;
}

type NewMember = Omit<MemberType, '_id' | 'updatedAt' | 'kind'> & { kind: MemberKind };

interface Actions {
  getMembers: (filters?: Partial<FilterData>) => Promise<void>;
  resetFilters: () => void;
  addMember: (newMember: NewMember) => Promise<void>;
  updateMember: (updatedMember: MemberType) => Promise<MemberType>;
  updateMemberKind: (id: string, kind: MemberKind) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  getCoinsTotal: (params: CoinsTotalParams) => Promise<void>;
  clearCoinsTotal: () => void;
  getMyCoins: () => Promise<MyCoins>;
}

let latestCoinsTotalRequest = 0;

const refreshCoinsTotal = ({ coinsTotalParams, getCoinsTotal }: State & Actions) => {
  if (coinsTotalParams) getCoinsTotal(coinsTotalParams).catch(notifyFailure);
};

const useMembersStore = create<State & Actions>((set, get) => ({
  members: [],
  membersDictionary: [],
  appliedFilters: {},
  coinsTotal: null,
  coinsTotalParams: null,
  isCoinsTotalLoading: false,
  loading: false,
  error: null,

  getMembers: async (filters) => {
    try {
      const response = await axios.get(`/members`, { params: filters });

      if (filters && !isObjEmpty(filters) && isObjValuesExist(filters)) {
        set({ appliedFilters: filters });
        return set({ members: response.data });
      }

      set({ appliedFilters: {} });
      set({ members: response.data, membersDictionary: response.data });
    } catch (error) {
      throw error;
    }
  },

  resetFilters: () => {
    set((state) => ({ appliedFilters: {}, members: state.membersDictionary }));
  },

  addMember: async (newMember) => {
    try {
      const response = await axios.post(`/members`, newMember);
      set((state) => ({ members: [...state.members, response.data] }));
      refreshCoinsTotal(get());
    } catch (error) {
      throw error;
    }
  },

  updateMember: async (updatedMember) => {
    try {
      const response = await axios.put(`/members`, updatedMember);

      set((state) => ({
        members: state.members.map((item) => {
          if (item._id === updatedMember._id) {
            return response.data;
          }

          return item;
        }),
      }));
      refreshCoinsTotal(get());

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateMemberKind: async (id, kind) => {
    await axios.patch(`/members/${id}/kind`, { kind });

    const mark = (member: MemberType) => (member._id === id ? { ...member, kind } : member);

    set((state) => ({
      members: state.members.map(mark),
      membersDictionary: state.membersDictionary.map(mark),
    }));
    refreshCoinsTotal(get());
  },

  deleteMember: async (id) => {
    await axios.delete(`/members/${id}`);

    set((state) => ({
      members: state.members.filter((member) => member._id !== id),
      membersDictionary: state.membersDictionary.filter((member) => member._id !== id),
    }));
    refreshCoinsTotal(get());
  },

  getCoinsTotal: async (params) => {
    const request = ++latestCoinsTotalRequest;

    set({ coinsTotalParams: params, isCoinsTotalLoading: true });

    try {
      const response = ensure(await axios.get<CoinsTotal>('/members/coins-total', { params }));

      if (request === latestCoinsTotalRequest) {
        set({ coinsTotal: { ...response.data, params } });
      }
    } catch (error) {
      if (request !== latestCoinsTotalRequest) return;

      set({ coinsTotal: null });

      throw error;
    } finally {
      if (request === latestCoinsTotalRequest) set({ isCoinsTotalLoading: false });
    }
  },

  clearCoinsTotal: () => {
    latestCoinsTotalRequest++;

    set({ coinsTotal: null, coinsTotalParams: null, isCoinsTotalLoading: false });
  },

  getMyCoins: async () => ensure(await axios.get<MyCoins>('/members/me')).data,
}));

export default useMembersStore;
