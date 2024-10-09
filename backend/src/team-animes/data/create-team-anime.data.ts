import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateAnimeData {
  @ApiProperty()
  @IsString()
  name: string;
}
