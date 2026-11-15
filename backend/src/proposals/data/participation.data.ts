import { z } from 'zod';
import { MEMBER_ROLE } from '../../shared/index.js';

export const ParticipationData = z.object({
  roles: z
    .array(z.enum(MEMBER_ROLE, { error: 'Невідома роль' }))
    .max(Object.values(MEMBER_ROLE).length),
});

export type ParticipationData = z.infer<typeof ParticipationData>;
