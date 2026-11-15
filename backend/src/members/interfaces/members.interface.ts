import type { MEMBER_KIND, SEASON } from '../../shared/index.js';

export interface IMember extends Document {
  nickname: string;
  types: string[];
  kind?: MEMBER_KIND;
  coins: number;
  seasons: { season: SEASON; year: number; coins: number }[];
  deletedAt?: Date;
  // When the audit took over the counters, and wrote their opening state
  crumbsAuditedAt?: Date;
}

export interface CoinsDelta {
  season: SEASON;
  year: number;
  delta: number;
  role?: string;
  actor: string;
}

export interface CoinsTotal {
  total: number;
  unmarkedCount: number;
}

export interface MyCoins {
  nickname: string | null;
  coins: number;
  currentSeason: { season: SEASON; year: number; coins: number };
}
