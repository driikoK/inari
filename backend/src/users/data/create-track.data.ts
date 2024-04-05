import { ApiProperty } from '@nestjs/swagger';
import { TypesEnum } from '../enums/types.enum';

export class CreateTrackData {
  @ApiProperty()
  nickname: string;

  @ApiProperty()
  nameTitle: string;

  @ApiProperty()
  typeRole: TypesEnum;

  @ApiProperty()
  coin: number;
}
