import { create } from 'zustand';
import axios from '@/api';

interface Role {
  value: string;
  label: string;
}

interface IState {
  roles: Role[];
  getRoles: () => Promise<void>;
}

const useRolesStore = create<IState>((set) => ({
  roles: [],

  getRoles: async () => {
    try {
      const response = await axios.get(`/users/roles`);
      set({ roles: response.data });
    } catch (error) {
      throw error;
    }
  },
}));

export default useRolesStore;
