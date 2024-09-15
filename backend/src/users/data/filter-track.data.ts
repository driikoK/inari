import { ApiPropertyOptional } from '@nestjs/swagger';
import { MEMBER_ROLE } from '../enums/types.enum';

export class FilterTrackData {
  @ApiPropertyOptional({ nullable: true })
  nickname: string;

  @ApiPropertyOptional({ nullable: true })
  season: number;

  @ApiPropertyOptional({ nullable: true })
  nameTitle: string;

  @ApiPropertyOptional({ nullable: true })
  typeRole: MEMBER_ROLE;
}
