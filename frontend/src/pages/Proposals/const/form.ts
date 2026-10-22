import { z } from 'zod';

import type { ProposalPayload } from '@/stores/useProposalsStore';
import { type FundingChoice, NO_FUNDING, PROPOSAL_FUNDING, TITLE_KIND } from '@/types';
import { seasonOptions } from '@/utils/constants';
import { httpUrl, LINK_MESSAGE } from '@/utils/validation';

const REQUIRED_MESSAGE = 'Обов’язкове поле';

export interface ProposalFormValues {
  seasonId: string;
  ukrName: string;
  romajiName: string;
  link: string;
  posterUrl: string;
  note: string;
  isOngoing: TITLE_KIND;
  funding: FundingChoice;
  isSequel: boolean;
}

export interface SeasonFormValues {
  season: string;
  year: string;
}

export const createProposalFormSchema = (): z.ZodType<ProposalFormValues, ProposalFormValues> =>
  z.object({
    seasonId: z.string(),
    ukrName: z.string({ error: REQUIRED_MESSAGE }).trim().min(1, REQUIRED_MESSAGE),
    romajiName: z.string({ error: REQUIRED_MESSAGE }).trim().min(1, REQUIRED_MESSAGE),
    link: z.string({ error: REQUIRED_MESSAGE }).trim().min(1, REQUIRED_MESSAGE).pipe(httpUrl),
    posterUrl: z
      .string()
      .trim()
      .refine((value) => value === '' || httpUrl.safeParse(value).success, LINK_MESSAGE),
    note: z.string().max(500, 'Максимум 500 символів'),
    isOngoing: z.enum(TITLE_KIND, { error: REQUIRED_MESSAGE }),
    funding: z.enum([NO_FUNDING, PROPOSAL_FUNDING.PATRON, PROPOSAL_FUNDING.ORDER]),
    isSequel: z.boolean(),
  });

export const createSeasonFormSchema = (): z.ZodType<SeasonFormValues, SeasonFormValues> =>
  z.object({
    season: z
      .string({ error: REQUIRED_MESSAGE })
      .refine((value) => seasonOptions.some((option) => option.value === value), REQUIRED_MESSAGE),
    year: z.string({ error: REQUIRED_MESSAGE }).min(1, REQUIRED_MESSAGE),
  });

export const toProposalPayload = (values: ProposalFormValues): ProposalPayload => ({
  seasonId: values.seasonId,
  ukrName: values.ukrName,
  romajiName: values.romajiName,
  link: values.link,
  posterUrl: values.posterUrl || null,
  note: values.note.trim() || null,
  isOngoing: values.isOngoing === TITLE_KIND.ONGOING,
  isSequel: values.isSequel,
  funding: values.funding === NO_FUNDING ? null : values.funding,
});
