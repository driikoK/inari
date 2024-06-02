import { CofType, CoinsType, ValuesType } from "./types";

export const initialValuesSetup = (nameTitle: string, cof: CofType, coins: CoinsType): ValuesType => ({
  main: {
    sub: { nickname: '', nameTitle: nameTitle, coin: cof.sub, typeRole: 'sub' },
    sound: {
      nickname: '',
      nameTitle: nameTitle,
      coin: cof.sound,
      typeRole: 'sound',
    },
    dub1: {
      nickname: '',
      nameTitle: nameTitle,
      coin: 0,
      typeRole: 'dub',
    },
  },
  bonus: {
    director: {
      nickname: '',
      nameTitle: nameTitle,
      coin: coins.BonusDirector,
      typeRole: 'director',
    },
    sub: { nickname: '', nameTitle: nameTitle, coin: 0, typeRole: 'sub' },
    sound: { nickname: '', nameTitle: nameTitle, coin: 0, typeRole: 'sound' },
    fixer: { nickname: '', nameTitle: nameTitle, coin: 0, typeRole: 'other' },
    roleBreaker: {
      nickname: '',
      nameTitle: nameTitle,
      coin: 0,
      typeRole: 'other',
    },
    release: {
      nickname: '',
      nameTitle: nameTitle,
      coin: 0,
      typeRole: 'release',
    },
    dub1: {
      nickname: '',
      nameTitle: nameTitle,
      coin: 0,
      typeRole: 'dub',
    },
  },
  dubs: [],
});

export const initialCof = {
  sub: 30,
  dub: 55,
  sound: 15,
}

export const coinsMock = {
  film: {
    type: 'film',
    coin: 200,
    coinBonus: 150,
    maxBonusOnRole: 30,
    maxBonusForOthers: 25,
    maxBonusForMainRoles: 15,
    BonusDirector: 60,
  },
  inTimeStandardAnime: {
    type: 'inTimeStandardAnime',
    coin: 100,
    coinBonus: 70,
    maxBonusOnRole: 10,
    maxBonusForOthers: 25,
    maxBonusForMainRoles: 15,
    BonusDirector: 30,
  },
  delayStandardAnime: {
    type: 'delayStandardAnime',
    coin: 100,
    coinBonus: 30,
    maxBonusOnRole: 10,
    maxBonusForOthers: 12,
    maxBonusForMainRoles: 8,
    BonusDirector: 10,
  },
};