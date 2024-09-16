import * as Yup from 'yup';

import { CreateTrackFormValues } from './types';

const fieldSchema = Yup.object().shape({
  nickname: Yup.string().required('Нікнейм обов’язковий'),
  coins: Yup.string()
    .test('is-not-zero', 'Дай хоча б 1 крихту', (value) => value !== '0' && value !== '')
    .required('Дай хоча б 1 крихту'),
  isGuest: Yup.boolean(),
});

const notRequiredFieldSchema = Yup.object().shape({
  nickname: Yup.string(),
  coins: Yup.string().when('nickname', (nickname) => {
    if (nickname[0]) {
      return Yup.string()
        .test('is-not-zero', 'Дай хоча б 1 крихту', (value) => value !== '' && value !== '0')
        .required('Дай хоча б 1 крихту');
    } else {
      return Yup.string().notRequired();
    }
  }),

  isGuest: Yup.boolean(),
});

export const createTrackFormSchema = Yup.object().shape({
  membersInfo: Yup.object().shape({
    sound: fieldSchema.required(),
    director: fieldSchema.required(),
    sub: fieldSchema.required(),
    editor: notRequiredFieldSchema.nullable().notRequired(),
    dubs: Yup.array().of(fieldSchema).max(10).min(1).required(),
    fixer: fieldSchema.required(),
    roleBreaker: fieldSchema.required(),
    releasers: Yup.array().of(fieldSchema).max(2).required(),
    another: notRequiredFieldSchema.nullable().notRequired(),
  }),
  note: Yup.string(),
  isFast: Yup.boolean().required(),
  isOngoing: Yup.boolean().required(),
  isPriority: Yup.boolean().required(),
  isInTime: Yup.boolean().required(),
});

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
