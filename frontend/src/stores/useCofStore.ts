import { create } from 'zustand';
import axios from 'axios';
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
    // eslint-disable-next-line no-useless-catch
    try {
      const response = await axios.get(`${process.env.API_URL}/cof`);
      set({ cof: response.data });
    } catch (error) {
      throw error;
    }
  },
}));

export default useCofStore;
