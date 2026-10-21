import type { MEMBER_KIND } from '../../shared/index.js';

export interface IMember extends Document {
  nickname: string;
  types: string[];
  kind?: MEMBER_KIND;
  coins: number;
  seasons: { season: string; year: number; coins: number }[];
  deletedAt?: Date;
}
