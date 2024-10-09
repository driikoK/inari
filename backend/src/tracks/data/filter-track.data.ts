import { ApiPropertyOptional } from '@nestjs/swagger';
import { MEMBER_ROLE, SEASON } from '@members/enums/types.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class FilterTrackData {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  nickname: string;

  @ApiPropertyOptional({
    nullable: true,
    enum: SEASON,
    enumName: 'Season',
  })
  @IsOptional()
  @IsEnum(SEASON)
  season: SEASON;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  nameTitle?: string;

  @ApiPropertyOptional({
    nullable: true,
    enum: MEMBER_ROLE,
    enumName: 'Role',
  })
  @IsOptional()
  @IsEnum(MEMBER_ROLE)
  typeRole?: MEMBER_ROLE;
}
