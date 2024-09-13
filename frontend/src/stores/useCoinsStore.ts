import { create } from 'zustand';
import axios from 'axios';
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
      coin: 0,
      maxAdditionalOnRole: 0,
      bonusDirector: 0,
    },
    series: {
      type: 'series',
      coin: 0,
      maxAdditionalOnRole: 0,
      bonusDirector: 0,
    },
    shortFilm: {
      type: 'shortFilm',
      coin: 0,
      maxAdditionalOnRole: 0,
      bonusDirector: 0,
    },
  },
  loading: false,
  error: null,

  getCoins: async () => {
    // eslint-disable-next-line no-useless-catch
    try {
      const response = await axios.get(`${process.env.API_URL}/settings/coins`);
      set({ coinsTypes: response.data });
    } catch (error: unknown) {
      throw error;
    }
  },
}));

export default useCoinsStore;
