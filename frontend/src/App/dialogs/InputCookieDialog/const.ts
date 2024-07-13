import { CofType, CoinsType, ValuesType } from './types';
import { getPartialValue } from './utils';

export const initialValuesSetup = (
  nameTitle: string,
  cof: CofType,
  coins: CoinsType,
  currentEpisode: string,
): ValuesType => ({
  main: {
    sub: {
      nickname: '',
      nameTitle,
      coin: getPartialValue(cof.sub, coins.coin),
      typeRole: 'sub',
      currentEpisode: parseFloat(currentEpisode),
    },
    sound: {
      nickname: '',
      nameTitle,
      coin: getPartialValue(cof.sound, coins.coin),
      typeRole: 'sound',
      currentEpisode: parseFloat(currentEpisode),
    },
    director: {
      nickname: '',
      nameTitle,
      coin: coins.bonusDirector,
      typeRole: 'director',
      currentEpisode: parseFloat(currentEpisode),
    },
    fixer: {
      nickname: '',
      nameTitle,
      coin: 0,
      typeRole: 'other',
      currentEpisode: parseFloat(currentEpisode),
    },
    roleBreaker: {
      nickname: '',
      nameTitle,
      coin: 0,
      typeRole: 'other',
      currentEpisode: parseFloat(currentEpisode),
    },
    release: {
      nickname: '',
      nameTitle,
      coin: 0,
      typeRole: 'other',
      currentEpisode: parseFloat(currentEpisode),
    },
    another: {
      nickname: '',
      nameTitle,
      coin: 0,
      typeRole: 'other',
      currentEpisode: parseFloat(currentEpisode),
    },
    dub1: {
      nickname: '',
      nameTitle,
      coin: 0,
      typeRole: 'dub',
      currentEpisode: parseFloat(currentEpisode),
    },
  },
  dubs: [''],
});