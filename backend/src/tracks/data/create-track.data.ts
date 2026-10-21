import { z } from 'zod';
import { ANIME_TYPE, MEMBER_ROLE, SEASON } from '../../shared/index.js';

export const MemberInfo = z.object({
  nickname: z.string().min(1),
  typeRole: z.enum(MEMBER_ROLE),
  coins: z
    .number({ error: 'Coins must be a number' })
    .positive('Coins must be at least 1'),
  isGuest: z.boolean().nullish(),
});

export type MemberInfo = z.infer<typeof MemberInfo>;

export const CreateTrackData = z.object({
  membersInfo: z.array(MemberInfo).min(1),
  isOngoing: z.boolean().nullish(),
  isPriority: z.boolean().nullish(),
  isInTime: z.boolean().nullish(),
  isGiveEditorCoins: z.boolean().nullish(),
  isGiveTypesetterCoins: z.boolean().nullish(),
  isGuest: z.boolean().nullish(),
  currentEpisode: z
    .int()
    .positive('Мусить бути більше 0')
    .max(999, 'Мусить бути менше 999'),
  nameTitle: z.string(),
  titleType: z.enum(ANIME_TYPE),
  season: z.enum(SEASON),
  year: z.int().min(2000),
  note: z.string().nullish(),
  username: z.string(),
  isSubsOnly: z.boolean().nullish(),
});

export type CreateTrackData = z.infer<typeof CreateTrackData>;
