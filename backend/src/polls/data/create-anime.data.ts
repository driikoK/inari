import { z } from 'zod';

export const CreateAnimeData = z.object({
  name: z.string().min(1).meta({ example: 'Кохання на кінчиках пальців' }),
  link: z.string().min(1).meta({
    example:
      'https://myanimelist.net/anime/57533/Youkai_Gakkou_no_Sensei_Hajimemashita/',
  }),
  posterUrl: z.string().min(1).meta({
    example: 'https://cdn.myanimelist.net/images/anime/1800/145662.jpg',
  }),
  isOngoing: z.boolean(),
  isPriority: z.boolean(),
  isDecided: z.boolean(),
  isSponsored: z.boolean(),
  note: z.string().nullish(),
});

export type CreateAnimeData = z.infer<typeof CreateAnimeData>;
