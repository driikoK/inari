import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '@users/users.service';
import { ROLE } from '@users/enums';

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

    // ** Root will be the first user with admin role to give roles other users
    if (username === 'root') {
      this.usersService.create(username, password, ROLE.ADMIN);
    } else {
      this.usersService.create(username, password, ROLE.MEMBER);
    }

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
