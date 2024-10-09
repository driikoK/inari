import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class UpdateTrackData {
  @ApiProperty()
  @IsInt()
  @IsPositive()
  coins: number;
}
