import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { INickname } from './interfaces/nickname.interface';
import { UserData } from './data/nickname.data';
@Injectable()
export class UserService {
  constructor(
    @Inject('NICKNAME_MODEL') private readonly nicknameModel: Model<INickname>,
  ) {}

  findAll(): Promise<INickname[]> {
    return this.nicknameModel.find().exec();
  }

  createUser(user: UserData): Promise<INickname> {
    return this.nicknameModel.create(user);
  }

  async updateUser(user: UserData) {
    await this.nicknameModel.updateOne({ nickname: user.nickname }, user);
  }

  async findUser(nickname: string) {
    const user = await this.nicknameModel
      .findOne({
        nickname: nickname,
      })
      .exec();

    if (!user) {
      throw new HttpException('User not found', 406);
    }

    return user;
  }
}
