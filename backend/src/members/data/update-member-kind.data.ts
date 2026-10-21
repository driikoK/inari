import { z } from 'zod';
import { MEMBER_KIND } from '../../shared/index.js';

export const UpdateMemberKindData = z.object({
  kind: z.enum(MEMBER_KIND, {
    error: 'Вкажіть, чи це гість, чи учасник команди',
  }),
});

export type UpdateMemberKindData = z.infer<typeof UpdateMemberKindData>;
