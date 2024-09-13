import { CofType, CoinsType, ValuesType } from './types';
import { getPartialValue } from './utils';

export const initialValuesSetup = (
  nameTitle: string,
  cof: CofType,
  coins: CoinsType,
  currentEpisode: string
): ValuesType => ({
  main: {
    sub: {
      nickname: '',
      nameTitle,
      coin: getPartialValue(cof.sub, coins.coin),
      typeRole: 'sub',
      currentEpisode: parseFloat(currentEpisode),
      isGuest: false,
    },
    sound: {
      nickname: '',
      nameTitle,
      coin: getPartialValue(cof.sound, coins.coin),
      typeRole: 'sound',
      currentEpisode: parseFloat(currentEpisode),
      isGuest: false,
    },
    director: {
      nickname: '',
      nameTitle,
      coin: coins.bonusDirector,
      typeRole: 'director',
      currentEpisode: parseFloat(currentEpisode),
      isGuest: false,
    },
    fixer: {
      nickname: '',
      nameTitle,
      coin: 0,
      typeRole: 'other',
      currentEpisode: parseFloat(currentEpisode),
      isGuest: false,
    },
    roleBreaker: {
      nickname: '',
      nameTitle,
      coin: 0,
      typeRole: 'other',
      currentEpisode: parseFloat(currentEpisode),
      isGuest: false,
    },
    release: {
      nickname: '',
      nameTitle,
      coin: 0,
      typeRole: 'other',
      currentEpisode: parseFloat(currentEpisode),
      isGuest: false,
    },
    another: {
      nickname: '',
      nameTitle,
      coin: 0,
      typeRole: 'other',
      currentEpisode: parseFloat(currentEpisode),
      isGuest: false,
    },
    dub1: {
      nickname: '',
      nameTitle,
      coin: 0,
      typeRole: 'dub',
      currentEpisode: parseFloat(currentEpisode),
      isGuest: false,
    },
  },
  dubs: [''],
  isFast: false,
  isOngoing: false,
  isPriority: false,
  isInTime: false,
});
