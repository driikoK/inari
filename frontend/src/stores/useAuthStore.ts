import { create } from 'zustand';
import axios from '@/api';

interface IState {
  isLoggedIn: boolean;
  signUp: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const useAuthStore = create<IState>((set) => ({
  isLoggedIn: localStorage.getItem('token') ? true : false,

  signUp: async (username: string, password: string) => {
    try {
      const response = await axios.post(`/auth/sign-up`, {
        username,
        password,
      });

      localStorage.setItem('token', response.data.accessToken);

      set({ isLoggedIn: true });
    } catch (error) {
      throw error;
    }
  },

  login: async (username: string, password: string) => {
    try {
      const response = await axios.post(`/auth/login`, {
        username,
        password,
      });

      localStorage.setItem('token', response.data.accessToken);

      set({ isLoggedIn: true });
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ isLoggedIn: false });
  },
}));

export default useAuthStore;
