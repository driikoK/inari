import { create } from 'zustand';
import axios from '@/api';
import { MemberType } from '@/types';
import { isObjEmpty, isObjValuesExist } from '@/utils/objects';

interface FilterData {
  id: string;
  role: string;
  season: string;
  year: number;
}

interface State {
  members: MemberType[];
  membersDictionary: MemberType[];
  appliedFilters: Partial<FilterData>;
}

interface Actions {
  getMembers: (filters?: Partial<FilterData>) => Promise<void>;
  addMember: (newMember: Omit<MemberType, '_id' | 'updatedAt'>) => Promise<void>;
  updateMember: (updatedMember: MemberType) => Promise<MemberType>;
}

const useMembersStore = create<State & Actions>((set) => ({
  members: [],
  membersDictionary: [],
  appliedFilters: {},
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

  addMember: async (newMember) => {
    try {
      const response = await axios.post(`/members`, newMember);
      set((state) => ({ members: [...state.members, response.data] }));
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

      return response.data;
    } catch (error) {
      throw error;
    }
  },
}));

export default useMembersStore;
