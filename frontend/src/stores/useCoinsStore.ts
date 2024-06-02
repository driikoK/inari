import { create } from 'zustand';
import axios from 'axios';
import { CoinsType } from '@/types';

interface IState {
  coinsTypes: {
    film: CoinsType;
    inTimeStandardAnime: CoinsType;
    delayStandardAnime: CoinsType;
  };
  getCoins: () => Promise<void>;
}

const useCoinsStore = create<IState>((set) => ({
  coinsTypes: {
    film: {
      type: 'film',
      coin: 0,
      coinBonus: 0,
      maxBonusOnRole: 0,
      maxBonusForOthers: 0,
      maxBonusForMainRoles: 0,
      BonusDirector: 0,
    },
    inTimeStandardAnime: {
      type: 'inTimeStandardAnime',
      coin: 0,
      coinBonus: 0,
      maxBonusOnRole: 0,
      maxBonusForOthers: 0,
      maxBonusForMainRoles: 0,
      BonusDirector: 0,
    },
    delayStandardAnime: {
      type: 'delayStandardAnime',
      coin: 0,
      coinBonus: 0,
      maxBonusOnRole: 0,
      maxBonusForOthers: 0,
      maxBonusForMainRoles: 0,
      BonusDirector: 0,
    },
  },
  loading: false,
  error: null,

  getCoins: async () => {
    // eslint-disable-next-line no-useless-catch
    try {
      const response = await axios.get(`${process.env.API_URL}/coins`);
      set({ coinsTypes: response.data });
    } catch (error: unknown) {
      throw error;
    }
  },
}));

export default useCoinsStore;
