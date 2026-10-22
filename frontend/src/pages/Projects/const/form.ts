import { z } from 'zod';

import type { Project, ProjectPayload } from '@/stores/useProjectsStore';
import type { Proposal } from '@/stores/useProposalsStore';
import { ANIME_TYPE, type FundingChoice, NO_FUNDING, PROPOSAL_FUNDING, TITLE_KIND } from '@/types';
import { httpUrl, LINK_MESSAGE } from '@/utils/validation';
import { MIN_DAY } from './options';

const REQUIRED_MESSAGE = 'Обов’язкове поле';

export interface ParticipantFormValues {
  key: string;
  nickname: string;
  roles: string[];
  source: string;
}

let rowCounter = 0;

export const participantRow = (
  row: Partial<Omit<ParticipantFormValues, 'key'>> = {},
): ParticipantFormValues => ({
  key: `row-${++rowCounter}`,
  nickname: '',
  roles: [],
  source: '',
  ...row,
});

export interface ProjectFormValues {
  ukrName: string;
  romajiName: string;
  codeName: string;
  link: string;
  posterUrl: string;
  titleType: ANIME_TYPE;
  isOngoing: TITLE_KIND;
  funding: FundingChoice;
  isSequel: boolean;
  startDate: string;
  episodesReleased: string;
  isFinished: boolean;
  endDate: string;
  isInTime: boolean;
  participants: ParticipantFormValues[];
}

export interface FinishFormValues {
  endDate: string;
  isInTime: boolean;
}

const endDateIssues = (endDate: string, startDate: string, today: string) => {
  if (endDate < startDate) return 'Дата завершення раніша за дату початку';
  if (endDate > today) return 'Дата завершення не може бути в майбутньому';

  return null;
};

export const createProjectFormSchema = (
  today: string,
): z.ZodType<ProjectFormValues, ProjectFormValues> =>
  z
    .object({
      ukrName: z.string({ error: REQUIRED_MESSAGE }).trim().min(1, REQUIRED_MESSAGE),
      romajiName: z.string({ error: REQUIRED_MESSAGE }).trim().min(1, REQUIRED_MESSAGE),
      codeName: z.string().trim().max(100, 'Максимум 100 символів'),
      link: z.string({ error: REQUIRED_MESSAGE }).trim().min(1, REQUIRED_MESSAGE).pipe(httpUrl),
      posterUrl: z
        .string()
        .trim()
        .refine((value) => value === '' || httpUrl.safeParse(value).success, LINK_MESSAGE),
      titleType: z.enum([
        ANIME_TYPE.SERIES,
        ANIME_TYPE.FILM,
        ANIME_TYPE.SHORT_FILM,
        ANIME_TYPE.TRAILER,
      ]),
      isOngoing: z.enum(TITLE_KIND),
      funding: z.enum([NO_FUNDING, PROPOSAL_FUNDING.PATRON, PROPOSAL_FUNDING.ORDER]),
      isSequel: z.boolean(),
      startDate: z
        .string({ error: REQUIRED_MESSAGE })
        .min(1, REQUIRED_MESSAGE)
        .refine((value) => value >= MIN_DAY, 'Дата не може бути раніше 2000 року')
        .refine((value) => value <= today, 'Дата початку не може бути в майбутньому'),
      episodesReleased: z.string().trim(),
      isFinished: z.boolean(),
      endDate: z.string(),
      isInTime: z.boolean(),
      participants: z.array(
        z.object({
          key: z.string(),
          nickname: z.string().min(1, 'Оберіть нікнейм або видаліть рядок'),
          roles: z.array(z.string()).min(1, 'Оберіть хоча б одну роль'),
          source: z.string(),
        }),
      ),
    })
    .superRefine((values, context) => {
      const isProgressValid = /^(\d{1,3})?$/.test(values.episodesReleased);

      if (values.titleType === ANIME_TYPE.SERIES && !isProgressValid) {
        context.addIssue({
          code: 'custom',
          path: ['episodesReleased'],
          message: 'Від 0 до 999',
        });
      }

      if (values.isFinished) {
        const message = values.endDate
          ? values.startDate && endDateIssues(values.endDate, values.startDate, today)
          : REQUIRED_MESSAGE;

        if (message) context.addIssue({ code: 'custom', path: ['endDate'], message });
      }

      const seen = new Set<string>();

      values.participants.forEach(({ nickname }, index) => {
        const key = nickname.toLowerCase();

        if (nickname && seen.has(key)) {
          context.addIssue({
            code: 'custom',
            path: ['participants', index, 'nickname'],
            message: 'Нікнейм вказано двічі',
          });
        }

        seen.add(key);
      });
    });

export const createFinishFormSchema = (
  startDate: string,
  today: string,
): z.ZodType<FinishFormValues, FinishFormValues> =>
  z
    .object({
      endDate: z.string({ error: REQUIRED_MESSAGE }).min(1, REQUIRED_MESSAGE),
      isInTime: z.boolean(),
    })
    .superRefine(({ endDate }, context) => {
      const message = endDate && endDateIssues(endDate, startDate, today);

      if (message) context.addIssue({ code: 'custom', path: ['endDate'], message });
    });

export const emptyProjectForm = (today: string): ProjectFormValues => ({
  ukrName: '',
  romajiName: '',
  codeName: '',
  link: '',
  posterUrl: '',
  titleType: ANIME_TYPE.SERIES,
  isOngoing: TITLE_KIND.ONGOING,
  funding: NO_FUNDING,
  isSequel: false,
  startDate: today,
  episodesReleased: '0',
  isFinished: false,
  endDate: '',
  isInTime: false,
  participants: [],
});

export const fromProject = (project: Project): ProjectFormValues => ({
  ukrName: project.ukrName,
  romajiName: project.romajiName,
  codeName: project.codeName ?? '',
  link: project.link,
  posterUrl: project.posterUrl ?? '',
  titleType: project.titleType,
  isOngoing: project.isOngoing ? TITLE_KIND.ONGOING : TITLE_KIND.OLD,
  funding: project.funding ?? NO_FUNDING,
  isSequel: project.isSequel,
  startDate: project.startDate,
  episodesReleased: String(project.episodesReleased),
  isFinished: project.isFinished,
  endDate: project.endDate ?? '',
  isInTime: project.isInTime,
  participants: project.participants.map(({ nickname, roles }) =>
    participantRow({ nickname, roles }),
  ),
});

export const fromProposal = (
  proposal: Proposal,
  nicknames: string[],
  today: string,
): ProjectFormValues => {
  const byLowerCase = new Map(nicknames.map((nickname) => [nickname.toLowerCase(), nickname]));

  return {
    ...emptyProjectForm(today),
    ukrName: proposal.ukrName,
    romajiName: proposal.romajiName,
    link: proposal.link,
    posterUrl: proposal.posterUrl ?? '',
    isOngoing: proposal.isOngoing ? TITLE_KIND.ONGOING : TITLE_KIND.OLD,
    funding: proposal.funding ?? NO_FUNDING,
    isSequel: proposal.isSequel,
    participants: proposal.participants.map(({ userName, roles }) => {
      const nickname = byLowerCase.get(userName.toLowerCase());

      return participantRow({ nickname: nickname ?? '', roles, source: nickname ? '' : userName });
    }),
  };
};

export const toFinishedPayload = (values: ProjectFormValues) =>
  values.isFinished ? { endDate: values.endDate, isInTime: values.isInTime } : {};

export const toProjectPayload = (values: ProjectFormValues): ProjectPayload => ({
  ukrName: values.ukrName,
  romajiName: values.romajiName,
  codeName: values.codeName.trim() || null,
  link: values.link,
  posterUrl: values.posterUrl || null,
  titleType: values.titleType,
  isOngoing: values.isOngoing === TITLE_KIND.ONGOING,
  isSequel: values.isSequel,
  funding: values.funding === NO_FUNDING ? null : values.funding,
  startDate: values.startDate,
  episodesReleased:
    values.titleType === ANIME_TYPE.SERIES ? Number(values.episodesReleased || 0) : 0,
  participants: values.participants.map(({ nickname, roles }) => ({ nickname, roles })),
});
