import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class UpdateMemberData {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString({
    each: true,
  })
  types: string[];

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  @Min(0, { message: 'Coins must be at least 0' })
  coins: number;
}
