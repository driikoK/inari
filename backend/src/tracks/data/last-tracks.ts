import { z } from 'zod';

export const LastTracksData = z.object({
  titleName: z.string().meta({ example: 'Кохання на кінчиках пальців' }),
  episode: z.coerce
    .number()
    .int()
    .min(2, 'Епізод мусить бути мінімум 2')
    .meta({ example: 2 }),
});

export type LastTracksData = z.infer<typeof LastTracksData>;
