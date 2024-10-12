import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signUp(
    username: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.usersService.findOne(username);

    if (user) {
      throw new UnauthorizedException('Такий нікнейм вже існує');
    }

    this.usersService.create(username, password);

    return {
      accessToken: await this.jwtService.signAsync({ username, password }),
    };
  }

  async login(username: string, password: string) {
    const user = await this.usersService.findOne(username);

    if (!user) {
      throw new UnauthorizedException('Такого юзера не існує');
    }

    return bcrypt.compare(password, user.password).then(async (result) => {
      if (result) {
        return {
          accessToken: await this.jwtService.signAsync({ username, password }),
        };
      } else {
        throw new UnauthorizedException('Невірний пароль');
      }
    });
  }
}
