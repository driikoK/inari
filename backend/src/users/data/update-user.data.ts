import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { ROLE } from '../enums';

export class UpdateUserData {
  @ApiProperty()
  @IsString()
  @IsEnum(ROLE, {
    message: 'Invalid role',
  })
  role: string;
}
