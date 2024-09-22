import { ApiPropertyOptional } from '@nestjs/swagger';
import { MEMBER_ROLE } from '../enums/types.enum';

export class NicknameFilterData {
  @ApiPropertyOptional({ nullable: true })
  id: string;

  @ApiPropertyOptional({ nullable: true })
  role: MEMBER_ROLE;

  @ApiPropertyOptional({ nullable: true })
  season: string;

  @ApiPropertyOptional({ nullable: true })
  year: number;
}
