import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
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
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: 'Coins must be a number' },
  )
  @Min(0)
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
