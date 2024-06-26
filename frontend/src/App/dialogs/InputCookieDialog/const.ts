import { CofType, CoinsType, ValuesType } from './types';
import { getPartialValue } from './utils';

export const initialValuesSetup = (
  nameTitle: string,
  cof: CofType,
  coins: CoinsType,
  currentEpisode: number,
): ValuesType => ({
  main: {
    sub: {
      nickname: '',
      nameTitle,
      coin: getPartialValue(cof.sub, coins.coin),
      typeRole: 'sub',
      currentEpisode,
    },
    sound: {
      nickname: '',
      nameTitle,
      coin: getPartialValue(cof.sound, coins.coin),
      typeRole: 'sound',
      currentEpisode,
    },
    director: {
      nickname: '',
      nameTitle,
      coin: coins.bonusDirector,
      typeRole: 'director',
      currentEpisode,
    },
    fixer: {
      nickname: '',
      nameTitle,
      coin: 0,
      typeRole: 'other',
      currentEpisode,
    },
    roleBreaker: {
      nickname: '',
      nameTitle,
      coin: 0,
      typeRole: 'other',
      currentEpisode,
    },
    release: {
      nickname: '',
      nameTitle,
      coin: 0,
      typeRole: 'other',
      currentEpisode,
    },
    dub1: {
      nickname: '',
      nameTitle,
      coin: 0,
      typeRole: 'dub',
      currentEpisode,
    },
  },
  dubs: [],
});