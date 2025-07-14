import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ForgotPasswordData {
  @ApiProperty()
  @IsString()
  @IsEmail()
  email: string;
}
