import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { isValidObjectId, Model } from 'mongoose';

import { CreateUserDto, IUser } from './interfaces/user.interface.js';
import { ROLE } from './enums/index.js';
import { UpdateUserData } from './data/update-user.data.js';

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
    const hash = await bcrypt.hash(password, 10);
    await this.userModel.create({ username, password: hash, role, email });

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

  async delete(id: string, currentUserId: string): Promise<string> {
    if (!isValidObjectId(id)) {
      throw new HttpException('Невірний id', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException('Юзера не знайдено');
    }

    if (user.username === 'root') {
      throw new HttpException('Не можна видаляти юзера', HttpStatus.CONFLICT);
    }

    if (String(user._id) === String(currentUserId)) {
      throw new HttpException('Не можна видалити себе', HttpStatus.CONFLICT);
    }

    await this.userModel.deleteOne({ _id: id });

    return user.username;
  }
}
