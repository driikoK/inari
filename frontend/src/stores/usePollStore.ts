import { create } from 'zustand';
import axios from '@/api';
import { ROLES_ON_VOTE } from '@/types';

export interface PollAnime {
  _id: string;
  name: string;
  link: string;
  posterUrl: string;
  isOngoing: boolean;
  isPriority: boolean;
  isDecided: boolean;
  isSponsored: boolean;
  note?: string;
}

export interface NewPollAnime extends Omit<PollAnime, '_id'> {}

interface Animes {
  olds: PollAnime[];
  ongoings: PollAnime[];
}

interface Vote {
  userName: string;
  roles: ROLES_ON_VOTE[];
}

export interface Result {
  animeId: string;
  animeName: string;
  totalVotes: number;
  link: string;
  votes: Vote[];
}

interface State {
  animes: Animes;
  isLoading: boolean;
  result: Result[];
}

interface Actions {
  getAnime: () => Promise<void>;
  addAnime: (newAnime: NewPollAnime) => Promise<void>;
  deleteAnime: (id: string) => Promise<void>;
  getResult: () => Promise<void>;
}

const usePollStore = create<State & Actions>((set, get) => ({
  animes: {
    olds: [],
    ongoings: [],
  },
  isLoading: false,
  result: [],

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
    try {
      await axios.post(`/polls/add-anime`, newAnime);

      get().getAnime();
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
  getResult: async () => {
    set({ isLoading: true });

    try {
      const response = await axios.get(`/polls/result`);

      set({ result: response.data });
    } catch (error) {
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default usePollStore;
