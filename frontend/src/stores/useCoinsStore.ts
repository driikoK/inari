import { create } from 'zustand';
import axios from '@/api';

import { CoinsType } from '@/types';

interface IState {
  coinsTypes: {
    film: CoinsType;
    series: CoinsType;
    shortFilm: CoinsType;
  };
  getCoins: () => Promise<void>;
}

const useCoinsStore = create<IState>((set) => ({
  coinsTypes: {
    film: {
      type: 'film',
      coins: 0,
      sub: 0,
      editor: 0,
      dub: {
        double: 0,
        multi: 0,
      },
      fixer: 0,
      roleBreaker: 0,
      sound: 0,
      releaser: 0,
      director: 0,
      another: 0,
    },
    series: {
      type: 'series',
      coins: 0,
      sub: 0,
      editor: 0,
      dub: {
        double: 0,
        multi: 0,
      },
      fixer: 0,
      roleBreaker: 0,
      sound: 0,
      releaser: 0,
      director: 0,
      another: 0,
    },
    shortFilm: {
      type: 'shortFilm',
      coins: 0,
      sub: 0,
      editor: 0,
      dub: {
        double: 0,
        multi: 0,
      },
      fixer: 0,
      roleBreaker: 0,
      sound: 0,
      releaser: 0,
      director: 0,
      another: 0,
    },
  },
  loading: false,
  error: null,

  getCoins: async () => {
    try {
      const response = await axios.get(`/settings/coins`);
      set({ coinsTypes: response.data });
    } catch (error: unknown) {
      throw error;
    }
  },
}));

export default useCoinsStore;
