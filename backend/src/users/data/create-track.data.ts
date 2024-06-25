import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypesEnum } from '../enums/types.enum';

export class CreateTrackData {
  @ApiProperty()
  nickname: string;

  @ApiProperty()
  nameTitle: string;

  @ApiPropertyOptional({nullable: true})
  note?: string;

  @ApiProperty()
  currentEpisode: number;

  @ApiProperty()
  typeRole: TypesEnum;

  @ApiProperty()
  coin: number;
}
