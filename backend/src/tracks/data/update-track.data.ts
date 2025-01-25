import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class UpdateTrackData {
  @ApiProperty()
  @IsNumber(
    { allowInfinity: false, allowNaN: false },
    { message: 'Coins must be a number' },
  )
  @Min(0)
  coins: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  username: string;
}
