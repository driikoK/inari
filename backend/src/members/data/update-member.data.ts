import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateMemberData {
  @ApiProperty()
  @IsString()
  nickname: string;

  @ApiProperty()
  @IsOptional()
  @IsString({
    each: true,
  })
  types?: string[];

  @ApiProperty()
  @IsInt()
  @IsPositive()
  coins: number;

  @ApiProperty()
  @IsOptional()
  seasons?: Season[];
}

class Season {
  @ApiProperty()
  @IsString()
  season: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  year: number;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  @IsPositive()
  coins: number;
}
