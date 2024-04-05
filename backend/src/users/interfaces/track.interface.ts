import { TypesEnum } from '../enums/types.enum';

export interface ITrack extends Document {
  nickname: string;
  nameTitle: string[];
  typeRole: TypesEnum;
  coin: number;
}
