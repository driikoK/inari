import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '@users/users.service';
import { ROLE } from '@users/enums';
import { EmailService } from 'src/email/email.service';
import { SignUpData } from './data/sign-up.data';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async signUp(signUpDto: SignUpData): Promise<boolean> {
    const { username } = signUpDto;
    const user = await this.usersService.findOneByUsername(username);

    if (user) {
      throw new HttpException('Такий нікнейм вже існує', HttpStatus.CONFLICT);
    }

    // ** Root will be the first user with admin role to give roles other users
    if (username === 'root') {
      this.usersService.create({ ...signUpDto, role: ROLE.ADMIN });
    } else {
      this.usersService.create({ ...signUpDto, role: ROLE.MEMBER });
    }

    return true;
  }

  async login(username: string, password: string) {
    const user = await this.usersService.findOneByUsername(username, true);

    if (!user) {
      throw new HttpException('Такого юзера не існує', HttpStatus.BAD_REQUEST);
    }

    return bcrypt.compare(password, user.password).then(async (result) => {
      if (result) {
        return {
          accessToken: await this.jwtService.signAsync({ username, password }),
        };
      } else {
        throw new HttpException('Невірний пароль', HttpStatus.BAD_REQUEST);
      }
    });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException(`No user found for email: ${email}`);
    }

    await this.emailService.sendResetPasswordLink(email);
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const email = await this.emailService.decodeConfirmationToken(token);

    const user = await this.usersService.findOneByEmail(email, true);
    if (!user) {
      throw new NotFoundException(`No user found for email: ${email}`);
    }

    await this.usersService.update(user._id, { password });
  }
}
