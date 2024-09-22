import { MEMBER_ROLE } from '../enums/types.enum';

export interface ITrack extends Document {
  nickname: string;
  nameTitle: string;
  typeRole: MEMBER_ROLE[];
  coins: number;
  season: string;
  year: number;
  currentEpisode: number;
}
