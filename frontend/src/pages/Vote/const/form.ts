import { z } from 'zod';
import { ChosenAnime } from '../types';
import { NewPollAnime } from '@/stores/usePollStore';

const REQUIRED_MESSAGE = 'Обов’язкове поле';

const requiredString = z.string({ error: REQUIRED_MESSAGE }).min(1, REQUIRED_MESSAGE);

const requiredUrl = z
  .string({ error: REQUIRED_MESSAGE })
  .trim()
  .min(1, REQUIRED_MESSAGE)
  .pipe(z.url({ protocol: /^https?$/, error: 'Введіть коректне посилання' }));

export const createChooseAnimeForm = () =>
  z.object({
    chosenAnimes: z
      .array(
        z.object({
          animeId: z.string().min(1),
          roles: z.array(z.string().min(1)),
        }),
        { error: 'Виберіть хоча б один тайтл' },
      )
      .min(1, 'Виберіть хоча б один тайтл'),
  });

export const chooseAnimeInitialFormValues = {
  chosenAnimes: [] as ChosenAnime[],
};

export const createPollAnimeSchema = () => {
  return z.object({
    name: requiredString,
    link: requiredUrl,
    posterUrl: requiredUrl,
    isOngoing: z.boolean(),
    isPriority: z.boolean(),
    isDecided: z.boolean(),
    isSponsored: z.boolean(),
    note: z.string().optional(),
  });
};

export const initialFormValues: NewPollAnime = {
  name: '',
  link: '',
  posterUrl: '',
  isOngoing: false,
  isPriority: false,
  isSponsored: false,
  isDecided: false,
};
