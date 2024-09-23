import { create } from 'zustand';
import axios from 'axios';
import { TrackType } from '@/types';
import { CreateTrackType } from '@/App/dialogs/InputCookieDialog/types';

interface UpdateTrackData {
  coins: number;
}

interface IState {
  tracks: TrackType[];
  getTracks: (filters?: {
    nickname?: string;
    season?: string;
    nameTitle?: string;
    typeRole?: string;
    year?: string;
  }) => Promise<void>;
  addTracks: (newTracks: CreateTrackType) => Promise<void>;
  deleteTracks: (id: string) => Promise<void>;
  updateTrack: (id: string, track: UpdateTrackData) => Promise<TrackType>;
}

const useTracksStore = create<IState>((set) => ({
  tracks: [],

  getTracks: async (filters) => {
    try {
      const response = await axios.get(`${process.env.API_URL}/users/tracks`, { params: filters });
      set({ tracks: response.data });
    } catch (error) {
      throw error;
    }
  },

  addTracks: async (newTracks: CreateTrackType) => {
    try {
      await axios.post(`${process.env.API_URL}/users/tracks`, newTracks);
    } catch (error) {
      throw error;
    }
  },
  deleteTracks: async (id: string) => {
    try {
      await axios.delete(`${process.env.API_URL}/users/track/${id}`);
      set((state) => ({ tracks: state.tracks.filter((item) => item._id !== id) }));
    } catch (error) {
      throw error;
    }
  },
  updateTrack: async (id: string, track: UpdateTrackData) => {
    try {
      const updatedTrack = await axios.put(`${process.env.API_URL}/users/track/${id}`, {
        coins: track.coins,
      });

      set((state) => ({
        tracks: state.tracks.map((item) => {
          if (item._id === id) {
            return updatedTrack.data;
          }

          return item;
        }),
      }));

      return updatedTrack.data;
    } catch (error) {
      throw error;
    }
  },
}));

export default useTracksStore;
