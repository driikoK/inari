import { z } from 'zod';
import { PROPOSAL_FUNDING } from '../enums/index.js';

const url = z.url({
  protocol: /^https?$/,
  error: 'Введіть коректне посилання',
});

const proposalFields = {
  ukrName: z.string().trim().min(1),
  romajiName: z.string().trim().min(1),
  link: url,
  posterUrl: url.nullish(),
  note: z.string().max(500).nullish(),
  isOngoing: z.boolean(),
  isSequel: z.boolean(),
  funding: z.enum(PROPOSAL_FUNDING, { error: 'Invalid funding' }).nullish(),
};

export const CreateProposalData = z.object({
  seasonId: z.string().min(1),
  ...proposalFields,
});

export const UpdateProposalData = z.object({
  seasonId: z.string().min(1).optional(),
  ...proposalFields,
});

export type CreateProposalData = z.infer<typeof CreateProposalData>;
export type UpdateProposalData = z.infer<typeof UpdateProposalData>;
