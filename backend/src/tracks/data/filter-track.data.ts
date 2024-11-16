import { ApiPropertyOptional } from '@nestjs/swagger';
import { MEMBER_ROLE, SEASON } from '@members/enums/types.enum';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterTrackData {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    nullable: true,
    enum: SEASON,
    enumName: 'Season',
  })
  @IsOptional()
  @IsEnum(SEASON)
  season?: SEASON;

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

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perPage?: number = 10;
}
