import { z } from 'zod';

export const UpdateTrackData = z.object({
  coins: z
    .number({ error: 'Coins must be a number' })
    .min(0, 'Coins must be at least 0'),
  username: z.string().min(1),
});

export type UpdateTrackData = z.infer<typeof UpdateTrackData>;
