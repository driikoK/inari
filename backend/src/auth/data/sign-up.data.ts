import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsStrongPassword, MinLength } from 'class-validator';

export class SignUpData {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  // @IsStrongPassword()
  password: string;
}
