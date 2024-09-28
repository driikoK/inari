import { create } from 'zustand';
import axios from '@/api';
import { CofType } from '@/types';

interface IState {
  cof: CofType;
  getCof: () => Promise<void>;
}

const useCofStore = create<IState>((set) => ({
  cof: {
    sub: 0,
    dub: 0,
    sound: 0,
    additional: 0,
    fastMultiplier: 1,
  },
  loading: false,
  error: null,

  getCof: async () => {
    try {
      const response = await axios.get(`/settings/cof`);
      set({ cof: response.data });
    } catch (error) {
      throw error;
    }
  },
}));

export default useCofStore;
