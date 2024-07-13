/* eslint-disable no-useless-catch */
import { create } from 'zustand';
import axios from 'axios';

interface IState {
  animeNames: { _id: string; count: number }[];
  getAnime: () => Promise<void>;
  addAnime: (newAnime: string) => Promise<void>;
}

const useAnimeStore = create<IState>((set) => ({
  animeNames: [],

  getAnime: async () => {
    try {
      const response = await axios.get(
        `${process.env.API_URL}/tracks/animeName`
      );
      set({ animeNames: response.data });
    } catch (error) {
      throw error;
    }
  },
  addAnime: async (newAnime: string) => {
    try {
      set((state) => ({
        animeNames: [...state.animeNames, { _id: newAnime, count: 1 }],
      }));
    } catch (error) {
      throw error;
    }
  },
}));

export default useAnimeStore;
