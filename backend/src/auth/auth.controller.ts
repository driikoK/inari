import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service.js';
import { SignUpData } from './data/sign-up.data.js';
import { LoginData } from './data/login.data.js';
import { ForgotPasswordData } from './data/forgot-password.data.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-up')
  signUp(@Body({ schema: SignUpData }) signUpDto: SignUpData) {
    return this.authService.signUp({ ...signUpDto });
  }

  @Post('login')
  signIn(@Body({ schema: LoginData }) signInDto: LoginData) {
    return this.authService.login(signInDto.username, signInDto.password);
  }

  @Post('forgot-password')
  forgotPassword(
    @Body({ schema: ForgotPasswordData }) { email }: ForgotPasswordData,
  ): Promise<void> {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() { token, password }: { token: string; password: string },
  ): Promise<void> {
    return this.authService.resetPassword(token, password);
  }
}
