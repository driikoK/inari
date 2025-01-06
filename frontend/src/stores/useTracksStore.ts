import { create } from 'zustand';
import axios from '@/api';
import { TrackType } from '@/types';
import { CreateTrackType } from '@/pages/Cookie/components/InputCookieDialog/types';

interface UpdateTrackData {
  coins: number;
}

interface TracksWithPagination {
  data: TrackType[];
  total: number;
  page: number;
  perPage: number;
}

interface FilterData {
  nickname: string;
  season: string;
  nameTitle: string;
  typeRole: string;
  year: string;
  page: number;
  perPage: number;
}

interface FilterForLastTracks {
  titleName: string;
  episode: number;
}

interface State {
  tracks: TracksWithPagination;
  isLoading: boolean;
  appliedFilters: Partial<FilterData>;
  lastTracks: TrackType[];
}

interface Actions {
  getTracks: (filters?: Partial<FilterData>) => Promise<void>;
  addTracks: (newTracks: CreateTrackType) => Promise<void>;
  deleteTracks: (id: string) => Promise<void>;
  updateTrack: (id: string, track: UpdateTrackData) => Promise<TrackType>;
  getLastTracks: (filter: FilterForLastTracks) => Promise<void>;
  resetLastTracks: () => void;
}

const useTracksStore = create<State & Actions>((set) => ({
  tracks: {
    data: [],
    total: 0,
    page: 1,
    perPage: 10,
  },
  isLoading: false,
  appliedFilters: {},
  lastTracks: [],

  getTracks: async (filters?: Partial<FilterData>) => {
    set({ isLoading: true, appliedFilters: filters });

    try {
      const response = await axios.get(`/tracks`, { params: filters });

      set({
        tracks: {
          ...response.data,
        },
      });
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addTracks: async (newTracks: CreateTrackType) => {
    try {
      await axios.post(`/tracks`, newTracks);
    } catch (error) {
      throw error;
    }
  },
  deleteTracks: async (id: string) => {
    try {
      await axios.delete(`/tracks/${id}`);
      set((state) => ({
        tracks: {
          ...state.tracks,
          data: state.tracks.data.filter((item) => item._id !== id),
        },
      }));
    } catch (error) {
      throw error;
    }
  },
  updateTrack: async (id: string, track: UpdateTrackData) => {
    try {
      const updatedTrack = await axios.put(`/tracks/${id}`, {
        coins: track.coins,
      });

      set((state) => ({
        tracks: {
          ...state.tracks,
          data: state.tracks.data.map((item) => {
            if (item._id === id) {
              return updatedTrack.data;
            }

            return item;
          }),
        },
      }));

      return updatedTrack.data;
    } catch (error) {
      throw error;
    }
  },

  getLastTracks: async (filters: FilterForLastTracks) => {
    set({ isLoading: true });

    try {
      const response = await axios.get(`/tracks/last`, { params: filters });

      set({
        lastTracks: [...response.data],
      });
    } catch (error) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  resetLastTracks: () => set({ lastTracks: [] }),
}));

export default useTracksStore;
