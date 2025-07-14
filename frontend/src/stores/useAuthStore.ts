import { create } from 'zustand';
import axios from '@/api';
import { ROLE } from '@/context/casl';

export type User = {
  username: string;
  role: ROLE;
  _id: string;
  email?: string;
};

interface State {
  isLoggedIn: boolean;
  user: User | null;
  allUsers: User[];
}

interface Actions {
  signUp: (username: string, password: string, email: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  getAllUsers: () => Promise<void>;
  updateUser: (id: string, role: ROLE, email?: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

const useAuthStore = create<State & Actions>((set) => ({
  isLoggedIn: localStorage.getItem('token') ? true : false,
  user: null,
  allUsers: [],

  signUp: async (username: string, password: string, email: string) => {
    try {
      await axios.post(`/auth/sign-up`, {
        username,
        password,
        email,
      });
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
    set({ isLoggedIn: false, user: null });
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

  updateUser: async (id: string, role: ROLE, email?: string) => {
    try {
      await axios.put(`/users/${id}`, { role, email });
    } catch (error) {
      throw error;
    }
  },

  forgotPassword: async (email: string) => {
    try {
      await axios.post(`/auth/forgot-password`, { email });
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (token: string, password: string) => {
    try {
      await axios.post(`/auth/reset-password`, { token, password });
    } catch (error) {
      throw error;
    }
  },
}));

export default useAuthStore;
