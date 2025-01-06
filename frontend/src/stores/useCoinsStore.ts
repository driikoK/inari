import { create } from 'zustand';
import axios from '@/api';

import { CoinsType } from '@/types';

const defaultCoinValues = {
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
};

interface State {
  coinsTypes: {
    film: CoinsType;
    series: CoinsType;
    shortFilm: CoinsType;
  };
}

interface Actions {
  getCoins: () => Promise<void>;
}

const useCoinsStore = create<State & Actions>((set) => ({
  coinsTypes: {
    film: {
      type: 'film',
      ...defaultCoinValues,
    },
    series: {
      type: 'series',
      ...defaultCoinValues,
    },
    shortFilm: {
      type: 'shortFilm',
      ...defaultCoinValues,
    },
  },
  loading: false,
  error: null,

  getCoins: async () => {
    try {
      const response = await axios.get(`/dictionaries/coins`);
      set({ coinsTypes: response.data });
    } catch (error: unknown) {
      throw error;
    }
  },
}));

export default useCoinsStore;
