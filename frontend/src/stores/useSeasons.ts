import { create } from 'zustand';
import axios from '@/api';

interface IState {
  seasons: { _id: number; count: number }[];
  getSeasons: () => Promise<void>;
}

const useSeasonsStore = create<IState>((set) => ({
  seasons: [],

  getSeasons: async () => {
    try {
      const response = await axios.get(`/tracks/seasons`);
      set({ seasons: response.data });
    } catch (error) {
      throw error;
    }
  },
}));

export default useSeasonsStore;
