/* eslint-disable no-useless-catch */
import { create } from 'zustand';
import axios from 'axios';

interface IState {
  animeNames: {_id: string, count: number}[];
  getAnime: () => Promise<void>;
}

const useAnimeStore = create<IState>((set) => ({
  animeNames: [],

  getAnime: async () => {
    try {
      const response = await axios.get(`${process.env.API_URL}/tracks/animeName`);
      set({ animeNames: response.data });
    } catch (error) {
      throw error;
    }
  },
}));

export default useAnimeStore;
