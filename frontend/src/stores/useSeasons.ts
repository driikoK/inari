/* eslint-disable no-useless-catch */
import { create } from 'zustand';
import axios from 'axios';

interface IState {
  seasons: { _id: number; count: number }[];
  getSeasons: () => Promise<void>;
}

const useSeasonsStore = create<IState>((set) => ({
  seasons: [],

  getSeasons: async () => {
    try {
      const response = await axios.get(`${process.env.API_URL}/users/tracks/seasons`);
      set({ seasons: response.data });
    } catch (error) {
      throw error;
    }
  },
}));

export default useSeasonsStore;
