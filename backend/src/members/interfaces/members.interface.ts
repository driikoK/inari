import type { MEMBER_KIND, SEASON } from '../../shared/index.js';

export interface IMember extends Document {
  nickname: string;
  types: string[];
  kind?: MEMBER_KIND;
  coins: number;
  seasons: { season: string; year: number; coins: number }[];
  deletedAt?: Date;
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
