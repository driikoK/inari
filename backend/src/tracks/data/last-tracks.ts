import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsPositive, IsString, Min } from 'class-validator';

export class LastTracksData {
  @ApiProperty({ example: 'Кохання на кінчиках пальців' })
  @IsString()
  titleName: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Min(2, { message: 'Епізод мусить бути мінімум 2' })
  episode: number;
}
