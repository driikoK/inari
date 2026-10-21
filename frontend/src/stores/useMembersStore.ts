import { create } from 'zustand';
import axios from '@/api';
import { MemberKind, MemberType } from '@/types';
import { isObjEmpty, isObjValuesExist } from '@/utils/objects';

interface FilterData {
  id: string;
  role: string;
  kind: string;
  season: string;
  year: number;
}

interface State {
  members: MemberType[];
  membersDictionary: MemberType[];
  appliedFilters: Partial<FilterData>;
}

type NewMember = Omit<MemberType, '_id' | 'updatedAt' | 'kind'> & { kind: MemberKind };

interface Actions {
  getMembers: (filters?: Partial<FilterData>) => Promise<void>;
  addMember: (newMember: NewMember) => Promise<void>;
  updateMember: (updatedMember: MemberType) => Promise<MemberType>;
  updateMemberKind: (id: string, kind: MemberKind) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
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

  updateMemberKind: async (id, kind) => {
    await axios.patch(`/members/${id}/kind`, { kind });

    const mark = (member: MemberType) => (member._id === id ? { ...member, kind } : member);

    set((state) => ({
      members: state.members.map(mark),
      membersDictionary: state.membersDictionary.map(mark),
    }));
  },

  deleteMember: async (id) => {
    await axios.delete(`/members/${id}`);

    set((state) => ({
      members: state.members.filter((member) => member._id !== id),
      membersDictionary: state.membersDictionary.filter((member) => member._id !== id),
    }));
  },
}));

export default useMembersStore;
