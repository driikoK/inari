import type { SEASON } from '../shared/index.js';
import { formatCrumbs, normalizeName, round3 } from './calc.js';
import { AUDIT_UNIT, SIDE_KIND } from './enums/index.js';
import type {
  CrumbAuditRow,
  CrumbSnapshot,
  MemberSnapshot,
  OperationHead,
  TrackSnapshot,
} from './interfaces/index.js';

// What a nickname had before its counters were audited for the first time
export interface CrumbsOpening {
  coins: number;
  seasons: { season: SEASON; year: number; coins: number }[];
}

export interface CrumbsChange {
  nickname: string;
  season: SEASON;
  year: number;
  delta: number;
  coins: number;
  seasonCoins: number;
}

export interface CrumbAuditItem {
  change: CrumbsChange;
  entryId?: string;
  before: CrumbSnapshot | null;
  after: CrumbSnapshot | null;
}

export const formatSignedCrumbs = (value: number) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatCrumbs(Math.abs(value))}`;

export const crumbsKey = (nickname: string) =>
  `crumbs:${normalizeName(nickname)}`;

const subjectOf = (nickname: string) => ({
  subjectKind: SIDE_KIND.CRUMBS,
  subjectKey: crumbsKey(nickname),
  subjectLabel: `Крихти: ${nickname}`,
});

export const trackSnapshot = ({
  nickname,
  nameTitle,
  currentEpisode,
  typeRole,
  season,
  year,
  coins,
}: Omit<TrackSnapshot, 'type'>): TrackSnapshot => ({
  type: 'track',
  nickname,
  nameTitle,
  currentEpisode,
  typeRole,
  season,
  year,
  coins: round3(coins),
});

export const memberSnapshot = ({
  nickname,
  coins,
  seasons,
}: Omit<MemberSnapshot, 'type'>): MemberSnapshot => ({
  type: 'member',
  nickname,
  coins: round3(coins),
  seasons: seasons.map(({ season, year, coins: seasonCoins }) => ({
    season,
    year,
    coins: round3(seasonCoins),
  })),
});

export const describeTrack = (
  { nickname, nameTitle, currentEpisode, typeRole, coins }: TrackSnapshot,
  roleLabel: (role: string) => string = (role) => role,
) =>
  `«${nameTitle}» еп. ${currentEpisode}, ${nickname} (${roleLabel(typeRole)}), ${formatCrumbs(coins)} крихт`;

export const crumbRow = (
  head: OperationHead,
  { change, entryId, before, after }: CrumbAuditItem,
): Omit<CrumbAuditRow, 'seq'> => ({
  ...head,
  unit: AUDIT_UNIT.CRUMBS,
  ...subjectOf(change.nickname),
  deltaCrumbs: round3(change.delta),
  balanceAfterCrumbs: round3(change.coins),
  seasonBalanceAfterCrumbs: round3(change.seasonCoins),
  season: change.season,
  year: change.year,
  ...(entryId && { entryId }),
  before,
  after,
});

export const openingRow = (
  head: OperationHead,
  nickname: string,
  { coins, seasons }: CrumbsOpening,
  season: SEASON,
  year: number,
): Omit<CrumbAuditRow, 'seq'> => ({
  ...head,
  unit: AUDIT_UNIT.CRUMBS,
  ...subjectOf(nickname),
  deltaCrumbs: round3(coins),
  balanceAfterCrumbs: round3(coins),
  seasonBalanceAfterCrumbs: round3(
    seasons.find((item) => item.season === season && item.year === year)
      ?.coins ?? 0,
  ),
  season,
  year,
  before: null,
  after: memberSnapshot({ nickname, coins, seasons }),
});
