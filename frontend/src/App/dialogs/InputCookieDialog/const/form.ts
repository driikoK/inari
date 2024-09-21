import * as Yup from 'yup';

import { ChooseAnimeFormValues, CreateTrackFormValues, FieldFormValue } from '../types';
import { CoinsType } from '@/types';

// ** For create track form
const testIsNotZero = Yup.string()
  .test('is-not-zero', 'Дай хоча б 1 крихту', (value) => value !== '' && value !== '0')
  .required('Дай хоча б 1 крихту');

const testIsMoreThanNeedCoins = (
  fieldValue: FieldFormValue[] = [],
  fieldName: 'dubs' | 'releasers',
  context: Yup.TestContext<Yup.AnyObject>,
  titleCoins: CoinsType
) => {
  // ** Needs only for checking number of dubs
  const isMulti = fieldValue!.length > 2;

  let coinsToCheck = 0;

  if (fieldName === 'releasers') {
    coinsToCheck = titleCoins.releaser;
  } else {
    coinsToCheck = isMulti ? titleCoins.dub.multi : titleCoins.dub.double;
  }

  const totalCoins =
    fieldValue?.reduce((sum, member) => {
      const coins = Number(member.coins);
      return sum + (isNaN(coins) ? 0 : coins);
    }, 0) || 0;

  if (totalCoins > coinsToCheck) {
    return context.createError({
      path: `membersInfo.${fieldName}.${fieldValue!.length - 1}.coins`,
      message: `Сума крихт повинна бути менше ${coinsToCheck}`,
    });
  }

  return true;
};

const fieldSchema = Yup.object().shape({
  nickname: Yup.string().required('Нікнейм обов’язковий'),
  coins: testIsNotZero,
  isGuest: Yup.boolean(),
});

const notRequiredFieldSchema = Yup.object().shape({
  nickname: Yup.string(),
  coins: Yup.string().when('nickname', (nickname) => {
    if (nickname[0]) return testIsNotZero;

    return Yup.string().notRequired();
  }),

  isGuest: Yup.boolean(),
});

export const createTrackFormSchema = (titleCoins: CoinsType) => {
  return Yup.object().shape({
    membersInfo: Yup.object().shape({
      sound: fieldSchema.required(),
      director: fieldSchema.required(),
      sub: fieldSchema.required(),
      editor: notRequiredFieldSchema.nullable().notRequired(),
      dubs: Yup.array()
        .of(fieldSchema)
        .min(1)
        .test('sum-of-coins-dubs', '', (dubs, context) =>
          testIsMoreThanNeedCoins(dubs, 'dubs', context, titleCoins)
        )
        .required(),
      fixer: fieldSchema.required(),
      roleBreaker: fieldSchema.required(),
      releasers: Yup.array()
        .of(fieldSchema)
        .max(2)
        .test('sum-of-coins-releasers', '', (releasers, context) =>
          testIsMoreThanNeedCoins(releasers, 'releasers', context, titleCoins)
        )
        .required(),
      another: notRequiredFieldSchema.nullable().notRequired(),
    }),
    note: Yup.string(),
    isFast: Yup.boolean().required(),
    isOngoing: Yup.boolean().required(),
    isPriority: Yup.boolean().required(),
    isInTime: Yup.boolean().required(),
  });
};

export const initialFormValues: CreateTrackFormValues = {
  membersInfo: {
    sound: { nickname: '', coins: '', isGuest: false },
    director: { nickname: '', coins: '', isGuest: false },
    sub: { nickname: '', coins: '', isGuest: false },
    editor: { nickname: '', coins: '', isGuest: false },
    dubs: [
      { nickname: '', coins: '', isGuest: false },
      { nickname: '', coins: '', isGuest: false },
    ],
    fixer: { nickname: '', coins: '', isGuest: false },
    roleBreaker: { nickname: '', coins: '', isGuest: false },
    releasers: [{ nickname: '', coins: '', isGuest: false }],
    another: { nickname: '', coins: '', isGuest: false },
  },
  note: '',
  isFast: false,
  isOngoing: false,
  isPriority: false,
  isInTime: false,
};

// ** For choose anime form
export const createChooseAnimeForm = () => {
  return Yup.object().shape({
    titleName: Yup.string().required('Обов’язкове поле'),
    episode: Yup.number()
      .min(1, 'Епізод мусить бути мінімум 1')
      .max(999, 'Епізод мусить бути максимум 999')
      .required('Обов’язкове поле'),
    animeType: Yup.string().required('Обов’язкове поле'),
    season: Yup.string().required('Обов’язкове поле'),
    year: Yup.string().required('Обов’язкове поле'),
  });
};

export const chooseAnimeInitialFormValues: ChooseAnimeFormValues = {
  titleName: '',
  episode: 1,
  animeType: '',
  season: '',
  year: '',
};
