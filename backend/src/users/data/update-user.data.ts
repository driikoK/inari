import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ROLE } from '../enums';

export class UpdateUserData {
  @IsOptional()
  @IsString()
  @IsEnum(ROLE, {
    message: 'Invalid role',
  })
  role?: string;

  @IsOptional()
  @IsString()
  @IsEmail({}, { message: 'Неправильна пошта' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  password?: string;
}
