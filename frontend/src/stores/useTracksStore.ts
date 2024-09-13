/* eslint-disable no-useless-catch */
import { create } from 'zustand';
import axios from 'axios';
import { TrackType } from '@/types';
import { CreateTrackType } from '@/App/dialogs/InputCookieDialog/types';

interface IState {
  tracks: TrackType[];
  getTracks: (filters?: {
    nickname?: string;
    season?: number;
    nameTitle?: string;
    typeRole?: string;
  }) => Promise<void>;
  addTracks: (newTracks: CreateTrackType) => Promise<void>;
  deleteTracks: (id: string) => Promise<void>;
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
}));

export default useTracksStore;
