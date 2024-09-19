import { ApiProperty } from '@nestjs/swagger';

export class UpdateTrackData {
  @ApiProperty()
  coins: number;
}
