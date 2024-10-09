import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { MEMBER_ROLE, SEASON } from '../enums/types.enum';

export class MemberFilterData {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ nullable: true, enum: MEMBER_ROLE, enumName: 'Role' })
  @IsOptional()
  @IsEnum(MEMBER_ROLE, {
    message: 'Invalid role',
  })
  role?: MEMBER_ROLE;

  @ApiPropertyOptional({
    nullable: true,
    enum: SEASON,
    enumName: 'Season',
  })
  @IsOptional()
  @IsEnum(SEASON, {
    message: 'Invalid season',
  })
  season?: SEASON;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  year?: number;
}
