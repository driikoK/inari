import { ANIME_TYPE, MEMBER_ROLE, SEASON } from '../../shared/index.js';
import {
  CreateTrackData,
  MemberInfo,
} from '../../tracks/data/create-track.data.js';

const CREATOR = 'root';

const SEASONS = [SEASON.WINTER, SEASON.SPRING, SEASON.SUMMER, SEASON.FALL];
const now = new Date();
const season = SEASONS[Math.floor(now.getMonth() / 3)];
const year = now.getFullYear();

const crew = (): MemberInfo[] => [
  { nickname: 'Luthien', typeRole: MEMBER_ROLE.SUB, coins: 30 },
  { nickname: 'Dixy', typeRole: MEMBER_ROLE.SOUND, coins: 30 },
  { nickname: 'Kitsune', typeRole: MEMBER_ROLE.DUB, coins: 50 },
  { nickname: 'Tanuki', typeRole: MEMBER_ROLE.DUB, coins: 50 },
  { nickname: 'Ronin', typeRole: MEMBER_ROLE.EDITOR, coins: 10 },
  { nickname: 'Sakura', typeRole: MEMBER_ROLE.DIRECTOR, coins: 10 },
];

const track = (
  nameTitle: string,
  currentEpisode: number,
  overrides: Partial<CreateTrackData> = {},
): CreateTrackData => ({
  nameTitle,
  currentEpisode,
  titleType: ANIME_TYPE.SERIES,
  season,
  year,
  username: CREATOR,
  isOngoing: true,
  isPriority: false,
  isInTime: true,
  membersInfo: crew(),
  ...overrides,
});

export const tracks: CreateTrackData[] = [
  track('Wind Breaker', 1),
  track('Wind Breaker', 2),
  track('Wind Breaker', 3, { isInTime: false, note: 'Затримка зі звуком' }),
  track('Date A Live V', 1, { isPriority: true }),
  track('Date A Live V', 2, {
    isPriority: true,
    membersInfo: [
      ...crew().slice(0, 5),
      {
        nickname: 'Sakura',
        typeRole: MEMBER_ROLE.DIRECTOR,
        coins: 10,
        isGuest: true,
      },
    ],
  }),
  track('Blue Archive', 1, { isOngoing: false }),
];
