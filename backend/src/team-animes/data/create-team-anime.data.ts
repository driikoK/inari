import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTeamAnimeData {
  @ApiProperty()
  @IsString()
  name: string;
}
