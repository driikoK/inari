/* eslint-disable no-useless-catch */
import { create } from 'zustand';
import axios from 'axios';
import { TrackType } from '@/types';

interface IState {
  tracks: TrackType[];
  getTracks: () => Promise<void>;
  addTracks: (newTracks: unknown[]) => Promise<void>;
}

const useTracksStore = create<IState>((set) => ({
  tracks: [],

  getTracks: async () => {
    try {
      const response = await axios.get(`${process.env.API_URL}/tracks`);
      set({ tracks: response.data });
    } catch (error) {
      throw error;
    }
  },

  addTracks: async (newTracks: unknown[]) => {
    try {
      await axios.post(
        `${process.env.API_URL}/tracks`,
        newTracks
      );
    } catch (error) {
      throw error;
    }
  },
}));

export default useTracksStore;
