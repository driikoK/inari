import { z } from 'zod';

import {
  ChooseAnimeFormValues,
  CreateTrackFormValues,
  CreateTrackWithSubsOnlyFormValues,
} from '../types';
import { CoinsType, ANIME_TYPE } from '@/types';

type ArrayFields = 'dubs' | 'releasers' | 'fixers';

const REQUIRED_MESSAGE = 'Обов’язкове поле';
const NO_COINS_MESSAGE = 'Дай хоча б 1 крихту';
const NICKNAME_MESSAGE = 'Нікнейм обов’язковий';

const requiredString = z.string({ error: REQUIRED_MESSAGE }).min(1, REQUIRED_MESSAGE);

// ** For create track form
const coinsField = z
  .string({ error: NO_COINS_MESSAGE })
  .refine((value) => value !== '' && value !== '0', NO_COINS_MESSAGE);

const fieldSchema = z.object({
  nickname: z.string({ error: NICKNAME_MESSAGE }).min(1, NICKNAME_MESSAGE),
  coins: coinsField,
  isGuest: z.boolean().optional(),
});

// Coins only matter once somebody is picked for the role
const notRequiredFieldSchema = z
  .object({
    nickname: z.string().optional(),
    coins: z.string().optional(),
    isGuest: z.boolean().optional(),
  })
  .refine((field) => !field.nickname || (!!field.coins && field.coins !== '0'), {
    path: ['coins'],
    error: NO_COINS_MESSAGE,
  });

const getArraySchema = (fieldName: ArrayFields, titleCoins: CoinsType, maxLength: number = 2) => {
  // The sum check goes first: zod skips checks chained after a failed min()/max()
  return z
    .array(fieldSchema)
    .check((ctx) => {
      const fieldValue = ctx.value;

      // ** Needs only for checking number of dubs
      const isMulti = fieldValue.length > 2;

      let coinsToCheck = 0;

      if (fieldName === 'releasers') {
        coinsToCheck = titleCoins.releaser;
      } else {
        coinsToCheck = isMulti ? titleCoins.dub.multi : titleCoins.dub.double;
      }

      const totalCoins = fieldValue.reduce((sum, member) => {
        const coins = Number(member.coins);
        return sum + (isNaN(coins) ? 0 : coins);
      }, 0);

      if (totalCoins > coinsToCheck) {
        // ** The error is shown under the last member of the group
        ctx.issues.push({
          code: 'custom',
          input: fieldValue,
          path: [fieldValue.length - 1, 'coins'],
          message: `Сума крихт повинна бути менше ${coinsToCheck}`,
        });
      }
    })
    .min(1)
    .max(maxLength);
};

export const createTrackFormSchema = (
  titleCoins: CoinsType,
): z.ZodType<CreateTrackFormValues, CreateTrackFormValues> => {
  return z.object({
    membersInfo: z.object({
      sound: fieldSchema,
      director: fieldSchema,
      sub: fieldSchema,
      editor: notRequiredFieldSchema.nullish(),
      dubs: getArraySchema('dubs', titleCoins, 10),
      fixers: getArraySchema('fixers', titleCoins),
      roleBreaker: notRequiredFieldSchema.nullish(),
      releasers: getArraySchema('releasers', titleCoins),
      typesetter: notRequiredFieldSchema.nullish(),
    }),
    note: z.string().optional(),
    isOngoing: z.boolean(),
    isPriority: z.boolean(),
    isInTime: z.boolean(),
    isGiveEditorCoins: z.boolean().optional(),
    isGiveTypesetterCoins: z.boolean().optional(),
    isLastEpisode: z.boolean().optional(),
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
    fixers: [{ nickname: '', coins: '', isGuest: false }],
    roleBreaker: { nickname: '', coins: '', isGuest: false },
    releasers: [{ nickname: '', coins: '', isGuest: false }],
    typesetter: { nickname: '', coins: '', isGuest: false },
  },
  note: '',
  isOngoing: false,
  isPriority: false,
  isInTime: false,
  isGiveEditorCoins: false,
  isGiveTypesetterCoins: false,
  isLastEpisode: false,
};

// ** For choose anime form
export const createChooseAnimeForm = (): z.ZodType<
  ChooseAnimeFormValues,
  ChooseAnimeFormValues
> => {
  return z
    .object({
      projectId: requiredString,
      titleName: requiredString,
      episode: z
        .number({ error: REQUIRED_MESSAGE })
        .min(1, 'Епізод мусить бути мінімум 1')
        .max(999, 'Епізод мусить бути максимум 999'),
      animeType: requiredString,
      season: requiredString,
      year: requiredString,
      duration: z
        .number()
        .min(1, 'Тривалість мусить бути мінімум 1')
        .max(999, 'Тривалість мусить бути максимум 999')
        .optional(),
      isSubsOnly: z.boolean().optional(),
    })
    .refine((form) => form.animeType !== ANIME_TYPE.SHORT_FILM || form.duration !== undefined, {
      path: ['duration'],
      error: REQUIRED_MESSAGE,
    });
};

export const chooseAnimeInitialFormValues: ChooseAnimeFormValues = {
  projectId: '',
  titleName: '',
  episode: 1,
  animeType: '',
  season: '',
  year: '',
  duration: 1,
  isSubsOnly: false,
};

// ** Form for creating track with subs only
export const createTrackWithSubsOnlyFormSchema = (
  titleCoins: CoinsType,
): z.ZodType<CreateTrackWithSubsOnlyFormValues, CreateTrackWithSubsOnlyFormValues> => {
  return z.object({
    membersInfo: z.object({
      director: fieldSchema,
      sub: fieldSchema,
      editor: notRequiredFieldSchema.nullish(),
      releasers: getArraySchema('releasers', titleCoins),
      typesetter: notRequiredFieldSchema.nullish(),
    }),
    note: z.string().optional(),
    isOngoing: z.boolean(),
    isPriority: z.boolean(),
    isInTime: z.boolean(),
    isGiveEditorCoins: z.boolean().optional(),
    isGiveTypesetterCoins: z.boolean().optional(),
  });
};

export const initialSubsOnlyFormValues: CreateTrackWithSubsOnlyFormValues = {
  membersInfo: {
    director: { nickname: '', coins: '', isGuest: false },
    sub: { nickname: '', coins: '', isGuest: false },
    editor: { nickname: '', coins: '', isGuest: false },
    releasers: [{ nickname: '', coins: '', isGuest: false }],
    typesetter: { nickname: '', coins: '', isGuest: false },
  },
  note: '',
  isOngoing: false,
  isPriority: false,
  isInTime: false,
  isGiveEditorCoins: false,
  isGiveTypesetterCoins: false,
};
