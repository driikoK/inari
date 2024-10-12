import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { IUser } from './interfaces/user.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  @Inject('USER_MODEL') private readonly userModel: Model<IUser>;

  async findOne(username: string): Promise<IUser | undefined> {
    return this.userModel.findOne({ username }).exec();
  }

  async create(username: string, password: string) {
    bcrypt.hash(password, 10, (err, hash) => {
      this.userModel.create({ username, password: hash });
    });

    return 'Created';
  }
}
