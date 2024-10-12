import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { SignUpData } from './data/sign-up.data';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-up')
  signUp(@Body() signUpDto: SignUpData) {
    return this.authService.signUp(signUpDto.username, signUpDto.password);
  }

  @Post('login')
  signIn(@Body() signInDto: SignUpData) {
    return this.authService.login(signInDto.username, signInDto.password);
  }
}
