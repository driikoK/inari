import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ANIME_TYPE, MEMBER_ROLE, SEASON } from '@members/enums/types.enum';
import {
  ArrayNotEmpty,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MemberInfo {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  nickname: string;

  @ApiProperty()
  @IsEnum(MEMBER_ROLE)
  typeRole: MEMBER_ROLE;

  @ApiProperty()
  @IsInt({ message: 'Coins must be an integer' })
  @IsPositive({
    message: 'Coins must be at least 1',
  })
  coins: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isGuest?: boolean;
}

export class CreateTrackData {
  @ApiProperty({ type: [MemberInfo] })
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => MemberInfo)
  membersInfo: MemberInfo[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFast?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isOngoing?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPriority?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isInTime?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isGiveEditorCoins?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isGiveTypesetterCoins?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isGuest?: boolean;

  @ApiProperty()
  @IsInt()
  @IsPositive({ message: 'Current episode must be at least 1' })
  @Max(999, { message: 'Current episode must be less than 999' })
  currentEpisode: number;

  @ApiProperty()
  @IsString()
  nameTitle: string;

  @ApiProperty()
  @IsEnum(ANIME_TYPE)
  titleType: ANIME_TYPE;

  @ApiProperty({ enum: SEASON, enumName: 'Season' })
  @IsEnum(SEASON)
  season: SEASON;

  @ApiProperty()
  @IsInt()
  @Min(2000)
  year: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  note?: string;
}
