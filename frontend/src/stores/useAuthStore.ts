import { create } from 'zustand';
import axios from '@/api';
import { ROLE } from '@/context/casl';

export type User = {
  username: string;
  role: ROLE;
  _id: string;
};

interface IState {
  isLoggedIn: boolean;
  user: User | null;
  allUsers: User[];
  signUp: (username: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  getAllUsers: () => Promise<void>;
  updateUser: (username: string, role: ROLE) => Promise<void>;
}

const useAuthStore = create<IState>((set) => ({
  isLoggedIn: localStorage.getItem('token') ? true : false,
  user: null,
  allUsers: [],

  signUp: async (username: string, password: string) => {
    try {
      const response = await axios.post(`/auth/sign-up`, {
        username,
        password,
      });

      localStorage.setItem('token', response.data.accessToken);
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

      await useAuthStore.getState().getCurrentUser();

      set({ isLoggedIn: true });
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ isLoggedIn: false });
    set({ user: null });
  },

  getCurrentUser: async () => {
    try {
      const response = await axios.get('/users/me');
      set({ user: response.data });
    } catch (error) {}
  },

  getAllUsers: async () => {
    try {
      const response = await axios.get('/users');
      set({ allUsers: response.data });
    } catch (error) {}
  },

  updateUser: async (username: string, role: ROLE) => {
    try {
      await axios.put(`/users/${username}`, { role });
    } catch (error) {}
  },
}));

export default useAuthStore;
