import { create } from 'zustand';
import axios from '@/api';

interface Role {
  value: string;
  label: string;
}

interface State {
  roles: Role[];
}

interface Actions {
  getRoles: () => Promise<void>;
}

const useRolesStore = create<State & Actions>((set) => ({
  roles: [],

  getRoles: async () => {
    try {
      const response = await axios.get(`/members/roles`);
      set({ roles: response.data });
    } catch (error) {
      throw error;
    }
  },
}));

export default useRolesStore;
