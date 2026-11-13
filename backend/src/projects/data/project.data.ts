import { z } from 'zod';
import { PROPOSAL_FUNDING } from '../../proposals/enums/index.js';
import { ANIME_TYPE, MEMBER_ROLE } from '../../shared/index.js';
import { MAX_PARTICIPANTS, MIN_PROJECT_DAY } from '../enums/index.js';

const url = z.url({
  protocol: /^https?$/,
  error: 'Введіть коректне посилання',
});

const day = z.iso
  .date({ error: 'Вкажіть коректну дату' })
  .refine((value) => value >= MIN_PROJECT_DAY, {
    error: 'Дата не може бути раніше 2000 року',
    when: ({ issues }) => issues.length === 0,
  });

const participant = z.object({
  nickname: z
    .string({ error: 'Вкажіть нікнейм' })
    .trim()
    .min(1, 'Вкажіть нікнейм'),
  roles: z
    .array(z.enum(MEMBER_ROLE, { error: 'Невідома роль' }))
    .min(1, 'Оберіть хоча б одну роль')
    .max(Object.values(MEMBER_ROLE).length),
});

const projectFields = {
  ukrName: z
    .string({ error: 'Вкажіть назву українською' })
    .trim()
    .min(1, 'Вкажіть назву українською'),
  romajiName: z
    .string({ error: 'Вкажіть назву ромаджі' })
    .trim()
    .min(1, 'Вкажіть назву ромаджі'),
  codeName: z.string().trim().max(100, 'Максимум 100 символів').nullish(),
  link: url,
  posterUrl: url.nullish(),
  titleType: z.enum(ANIME_TYPE, { error: 'Невідомий тип проєкту' }),
  isOngoing: z.boolean(),
  isSequel: z.boolean(),
  funding: z.enum(PROPOSAL_FUNDING, { error: 'Невідомий вид' }).nullish(),
  startDate: day,
  episodesReleased: z
    .int('Кількість серій має бути цілим числом')
    .min(0, 'Кількість серій не може бути від’ємною')
    .max(999, 'Кількість серій не може перевищувати 999'),
  participants: z
    .array(participant)
    .max(MAX_PARTICIPANTS, 'Забагато учасників')
    .refine(
      (list) =>
        new Set(list.map(({ nickname }) => nickname.toLowerCase())).size ===
        list.length,
      'Один нікнейм вказано двічі',
    ),
};

const finishedFields = {
  endDate: day.nullish(),
  isInTime: z.boolean().nullish(),
};

export const CreateProjectData = z.object({
  ...projectFields,
  ...finishedFields,
  proposalId: z.string().min(1).nullish(),
});

export const UpdateProjectData = z.object({
  ...projectFields,
  ...finishedFields,
});

export const FinishProjectData = z.object({
  endDate: day,
  isInTime: z.boolean(),
});

export type CreateProjectData = z.infer<typeof CreateProjectData>;
export type UpdateProjectData = z.infer<typeof UpdateProjectData>;
export type FinishProjectData = z.infer<typeof FinishProjectData>;
