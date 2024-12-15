import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateAnimeData {
  @ApiProperty({ example: 'Кохання на кінчиках пальців' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  link: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  posterUrl: string;

  @ApiProperty()
  @IsBoolean()
  isOngoing: boolean;

  @ApiProperty()
  @IsBoolean()
  isPriority: boolean;

  @ApiProperty()
  @IsBoolean()
  isDecided: boolean;

  @ApiProperty()
  @IsBoolean()
  isSponsored: boolean;
}
