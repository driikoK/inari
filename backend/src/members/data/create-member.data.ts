import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMemberData {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @ApiProperty()
  @IsArray()
  @IsString({ each: true })
  types: string[];

  @ApiPropertyOptional({
    type: Number,
  })
  @IsOptional()
  @IsInt({ message: 'Coins must be an integer' })
  @Min(0, { message: 'Coins must be at least 0' })
  coins?: number;
}
