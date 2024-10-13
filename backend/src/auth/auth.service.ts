import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
      throw new HttpException('Такий нікнейм вже існує', HttpStatus.CONFLICT);
    }

    this.usersService.create(username, password);

    return {
      accessToken: await this.jwtService.signAsync({ username, password }),
    };
  }

  async login(username: string, password: string) {
    const user = await this.usersService.findOne(username);

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
}
