import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';

import { CreateUserDto, IUser } from './interfaces/user.interface';
import { ROLE } from './enums';
import { UpdateUserData } from './data/update-user.data';

@Injectable()
export class UsersService {
  @Inject('USER_MODEL') private readonly userModel: Model<IUser>;

  async findOneByUsername(
    username: string,
    withPassword: true,
  ): Promise<IUser | undefined>;
  async findOneByUsername(
    username: string,
    withPassword?: false,
  ): Promise<Omit<IUser, 'password'> | undefined>;
  async findOneByUsername(
    username: string,
    withPassword?: boolean,
  ): Promise<IUser | Omit<IUser, 'password'> | undefined> {
    if (!username) throw new HttpException('Username is required', 400);
    return this.findOneByField('username', username, withPassword);
  }

  async findOneByEmail(
    email: string,
    withPassword: true,
  ): Promise<IUser | undefined>;
  async findOneByEmail(
    email: string,
    withPassword?: false,
  ): Promise<Omit<IUser, 'password'> | undefined>;
  async findOneByEmail(
    email: string,
    withPassword?: boolean,
  ): Promise<IUser | Omit<IUser, 'password'> | undefined> {
    if (!email) throw new HttpException('Email is required', 400);
    return this.findOneByField('email', email, withPassword);
  }

  private async findOneByField<T extends 'username' | 'email'>(
    field: T,
    value: string,
    withPassword?: boolean,
  ): Promise<IUser | Omit<IUser, 'password'> | undefined> {
    return this.userModel
      .findOne({ [field]: value }, { password: withPassword ? 1 : 0 })
      .exec();
  }

  async findAll(): Promise<IUser[] | []> {
    return this.userModel.find({}, { username: 1, role: 1, _id: 1 }).exec();
  }

  async create({
    username,
    password,
    email,
    role,
  }: CreateUserDto): Promise<string> {
    bcrypt.hash(password, 10, (err, hash) => {
      this.userModel.create({ username, password: hash, role, email });
    });

    return 'Created';
  }

  private async checkPassword(
    newPassword: string,
    old: string,
  ): Promise<string> {
    const isPasswordTheSame = await bcrypt.compare(newPassword, old);

    if (isPasswordTheSame) {
      return old;
    } else {
      return await bcrypt.hash(newPassword, 10);
    }
  }

  async update(
    _id: string,
    updateUserData: UpdateUserData,
  ): Promise<Omit<IUser, 'password'>> {
    const user = await this.userModel.findOne({ _id }).exec();
    if (user.username === 'root') {
      throw new HttpException('Не можна редагувати юзера', HttpStatus.CONFLICT);
    }

    // if (updateUserData.password) {
    //   const isPasswordTheSame = await bcrypt.compare(
    //     updateUserData.password,
    //     user.password,
    //   );

    //   if (isPasswordTheSame) {
    //     updateUserData.password = user.password;
    //   } else {
    //     updateUserData.password = await bcrypt.hash(
    //       updateUserData.password,
    //       10,
    //     );
    //   }
    // }
    if (updateUserData.password) {
      updateUserData.password = await this.checkPassword(
        updateUserData.password,
        user.password,
      );
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      _id,
      updateUserData,
      { new: true, select: '-password -__v' },
    );

    return updatedUser;
  }
}
