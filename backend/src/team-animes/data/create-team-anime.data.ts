import { ApiProperty } from '@nestjs/swagger';

export class CreateAnimeData {
  @ApiProperty()
  name: string;
}
