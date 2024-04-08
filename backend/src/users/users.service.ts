import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { INickname } from './interfaces/nickname.interface';
import { UserData } from './data/nickname.data';
@Injectable()
export class UserService {
  constructor(
    @Inject('NICKNAME_MODEL') private readonly nicknameModel: Model<INickname>,
  ) {}

  async findAll(): Promise<INickname[]> {
    return this.nicknameModel.find().exec();
  }

  async createUser(user: UserData): Promise<INickname> {
    const createdNickname = this.nicknameModel.create(user);

    return createdNickname;
  }

  async updateUser(user: UserData) {
    this.nicknameModel.updateOne(user, user);
  }
}
