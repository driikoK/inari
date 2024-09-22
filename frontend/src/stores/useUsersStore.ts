import { create } from 'zustand';
import axios from 'axios';
import { UserType } from '@/types';
import { isObjEmpty, isObjValuesExist } from '@/utils/utility.utils';

interface FilterData {
  id: string;
  role: string;
  season: string;
  year: number;
}

interface IState {
  users: UserType[];
  usersDictionary: UserType[];
  getUsers: (filters?: Partial<FilterData>) => Promise<void>;
  addUser: (newUser: Omit<UserType, '_id'>) => Promise<void>;
  appliedFilters: Partial<FilterData>;
}

const useUsersStore = create<IState>((set) => ({
  users: [],
  usersDictionary: [],
  appliedFilters: {},
  loading: false,
  error: null,

  getUsers: async (filters) => {
    try {
      const response = await axios.get(`${process.env.API_URL}/users`, { params: filters });

      if (filters && !isObjEmpty(filters) && isObjValuesExist(filters)) {
        set({ appliedFilters: filters });
        return set({ users: response.data });
      }

      set({ appliedFilters: {} });
      set({ users: response.data, usersDictionary: response.data });
    } catch (error) {
      throw error;
    }
  },

  addUser: async (newUser) => {
    try {
      const response = await axios.post(`${process.env.API_URL}/users`, newUser);
      set((state) => ({ users: [...state.users, response.data] }));
    } catch (error) {
      throw error;
    }
  },
}));

export default useUsersStore;
