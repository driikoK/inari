import { MEMBER_ROLE } from '../../shared/index.js';
import {
  CreateTrackData,
  MemberInfo,
} from '../../tracks/data/create-track.data.js';

const CREATOR = 'root';

const crew = (): MemberInfo[] => [
  { nickname: 'Luthien', typeRole: MEMBER_ROLE.SUB, coins: 30 },
  { nickname: 'Dixy', typeRole: MEMBER_ROLE.SOUND, coins: 30 },
  { nickname: 'Kitsune', typeRole: MEMBER_ROLE.DUB, coins: 50 },
  { nickname: 'Tanuki', typeRole: MEMBER_ROLE.DUB, coins: 50 },
  { nickname: 'Ronin', typeRole: MEMBER_ROLE.EDITOR, coins: 10 },
  { nickname: 'Sakura', typeRole: MEMBER_ROLE.DIRECTOR, coins: 10 },
];

// The track of a project, which is named here by its romaji name
export interface SeedTrack extends Omit<CreateTrackData, 'projectId'> {
  title: string;
}

const track = (
  title: string,
  currentEpisode: number,
  overrides: Partial<SeedTrack> = {},
): SeedTrack => ({
  title,
  currentEpisode,
  username: CREATOR,
  isOngoing: true,
  isPriority: false,
  isInTime: true,
  membersInfo: crew(),
  ...overrides,
});

export const tracks: SeedTrack[] = [
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
