import { z } from 'zod';
import { PROPOSAL_ROLES } from '../enums/index.js';

export const ParticipationData = z.object({
  roles: z
    .array(z.enum(PROPOSAL_ROLES, { error: 'Invalid role' }))
    .max(PROPOSAL_ROLES.length),
});

export type ParticipationData = z.infer<typeof ParticipationData>;
