/* eslint-disable no-useless-catch */
import { create } from 'zustand';
import axios from 'axios';

interface IState {
  types: string[];
  getTypes: () => Promise<void>;
}

const useTypeStore = create<IState>((set) => ({
  types: [],

  getTypes: async () => {
    try {
      const response = await axios.get(`${process.env.API_URL}/types`);
      set({ types: response.data });
    } catch (error) {
      throw error;
    }
  },
}));

export default useTypeStore;
