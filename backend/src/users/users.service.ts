import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';

import { IUser } from './interfaces/user.interface';
import { ROLE } from './enums';
import { UpdateUserData } from './data/update-user.data';

@Injectable()
export class UsersService {
  @Inject('USER_MODEL') private readonly userModel: Model<IUser>;

  async findOne(username: string): Promise<IUser | undefined> {
    return this.userModel.findOne({ username }).exec();
  }

  async findAll(): Promise<IUser[] | []> {
    return this.userModel.find({}, { username: 1, role: 1, _id: 1 }).exec();
  }

  async create(username: string, password: string, role: ROLE) {
    bcrypt.hash(password, 10, (err, hash) => {
      this.userModel.create({ username, password: hash, role });
    });

    return 'Created';
  }

  async getCurrentUser(username: string) {
    const user = await this.userModel.findOne({ username }).exec();

    return { username: user.username, role: user.role };
  }

  async updateCurrentUser(username: string, updateUserData: UpdateUserData) {
    if (username === 'root')
      throw new HttpException('Не можна редагувати юзера', HttpStatus.CONFLICT);

    await this.userModel.updateOne(
      {
        username,
      },
      updateUserData,
    );

    const updatedUser = await this.userModel.findOne({
      username,
    });

    return updatedUser;
  }
}
