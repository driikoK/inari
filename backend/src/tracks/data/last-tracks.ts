import { z } from 'zod';

export const LastTracksData = z.object({
  projectId: z.string().min(1).meta({ example: '61c0ccf11d7bf83d153d7c06' }),
  episode: z.coerce
    .number()
    .int()
    .min(2, 'Епізод мусить бути мінімум 2')
    .meta({ example: 2 }),
});

export type LastTracksData = z.infer<typeof LastTracksData>;
