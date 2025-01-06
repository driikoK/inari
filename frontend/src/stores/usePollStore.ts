import { create } from 'zustand';
import axios from '@/api';

export interface PollAnime {
  _id: string;
  name: string;
  link: string;
  posterUrl: string;
  isOngoing: boolean;
  isPriority: boolean;
  isDecided: boolean;
  isSponsored: boolean;
}

export interface NewPollAnime extends Omit<PollAnime, '_id'> {}

interface Animes {
  olds: PollAnime[];
  ongoings: PollAnime[];
}

interface State {
  animes: Animes;
  isLoading: boolean;
}

interface Actions {
  getAnime: () => Promise<void>;
  addAnime: (newAnime: NewPollAnime) => Promise<void>;
  deleteAnime: (id: string) => Promise<void>;
}

const usePollStore = create<State & Actions>((set) => ({
  animes: {
    olds: [],
    ongoings: [],
  },
  isLoading: false,

  getAnime: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get(`/polls/animes`);
      set({ animes: response.data });
    } catch (error) {
    } finally {
      set({ isLoading: false });
    }
  },
  addAnime: async (newAnime: NewPollAnime) => {
    const getUpdatedData = (prevData: PollAnime[], isOngoing: boolean): NewPollAnime[] =>
      isOngoing ? [...prevData, newAnime] : [...prevData];

    try {
      await axios.post(`/polls/add-anime`, newAnime);

      set((state) => ({
        animes: {
          ...state.animes,
          ongoings: getUpdatedData(state.animes.ongoings, true),
          olds: getUpdatedData(state.animes.olds, false),
        } as Animes,
      }));
    } catch (error) {
      throw error;
    }
  },
  deleteAnime: async (id: string) => {
    const getDataWithoutDeleted = (prevData: PollAnime[]): PollAnime[] =>
      prevData.filter((item) => item._id !== id);

    try {
      await axios.delete(`/polls/animes/${id}`);

      set((state) => ({
        animes: {
          ...state.animes,
          ongoings: getDataWithoutDeleted(state.animes.ongoings),
          olds: getDataWithoutDeleted(state.animes.olds),
        } as Animes,
      }));
    } catch (error) {}
  },
}));

export default usePollStore;
