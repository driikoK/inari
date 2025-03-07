import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAnimeData {
  @ApiProperty({ example: 'Кохання на кінчиках пальців' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example:
      'https://myanimelist.net/anime/57533/Youkai_Gakkou_no_Sensei_Hajimemashita/',
  })
  @IsString()
  @IsNotEmpty()
  link: string;

  @ApiProperty({
    example: 'https://cdn.myanimelist.net/images/anime/1800/145662.jpg',
  })
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

  @ApiProperty()
  @IsString()
  @IsOptional()
  note?: string;
}
