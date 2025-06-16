import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SignUpData {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  password: string;
}
