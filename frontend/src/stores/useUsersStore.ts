/* eslint-disable no-useless-catch */
import { create } from 'zustand';
import axios from 'axios';
import { UserType } from '@/types';

interface IState {
  users: UserType[];
  getUsers: () => Promise<void>;
  addUser: (newUser: unknown) => Promise<void>;
}

const useUsersStore = create<IState>((set) => ({
  users: [],
  loading: false,
  error: null,

  getUsers: async () => {
    try {
      const response = await axios.get(`${process.env.API_URL}/users`);
      set({ users: response.data });
    } catch (error) {
      throw error;
    }
  },

  addUser: async (newUser) => {
    try {
      const response = await axios.post(
        `${process.env.API_URL}/users`,
        newUser
      );
      set((state) => ({ users: [...state.users, response.data] }));
    } catch (error) {
      throw error;
    }
  },
}));

export default useUsersStore;
