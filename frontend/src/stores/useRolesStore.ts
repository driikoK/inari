import { create } from 'zustand';
import axios from '@/api';
import { ensure } from '@/utils/request';

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

const useRolesStore = create<State & Actions>((set, get) => ({
  roles: [],

  getRoles: async () => {
    const { roles } = get();
    if (roles.length) return;

    const response = ensure(await axios.get('/members/roles'));

    set({ roles: response.data });
  },
}));

export default useRolesStore;
