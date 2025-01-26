import { create } from 'zustand';
import axios from '@/api';

interface IAnime {
  _id: string;
  name: string;
}

interface State {
  animeNames: IAnime[];
}

interface Actions {
  getAnimes: () => Promise<void>;
  addAnime: (newAnime: string) => Promise<void>;
  deleteAnime: (id: string) => Promise<void>;
}

const useAnimesStore = create<State & Actions>((set, get) => ({
  animeNames: [],

  getAnimes: async () => {
    const { animeNames } = get();
    if (animeNames.length) return;

    try {
      const response = await axios.get(`/team-animes`);
      set({ animeNames: response.data });
    } catch (error) {
      throw error;
    }
  },

  addAnime: async (newAnime: string) => {
    try {
      const response = await axios.post(`/team-animes`, { name: newAnime });
      set((state) => ({ animeNames: [...state.animeNames, response.data] }));
    } catch (error) {
      throw error;
    }
  },

  deleteAnime: async (id: string) => {
    try {
      await axios.delete(`/team-animes/${id}`);
      set((state) => ({
        animeNames: state.animeNames.filter((item) => item._id !== id),
      }));
    } catch (error) {}
  },
}));

export default useAnimesStore;
