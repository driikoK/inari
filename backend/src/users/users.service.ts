import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { INickname } from './interfaces/nickname.interface';
import { UserData } from './data/nickname.data';
import { MEMBER_ROLE } from './enums/types.enum';
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

  getAllRoles() {
    return [
      { value: MEMBER_ROLE.DIRECTOR, label: 'Куратор' },
      { value: MEMBER_ROLE.DUB, label: 'Дабер(ша)' },
      { value: MEMBER_ROLE.ANOTHER, label: 'Інше' },
      { value: MEMBER_ROLE.SOUND, label: 'Звукарь' },
      { value: MEMBER_ROLE.EDITOR, label: 'Редактор' },
      { value: MEMBER_ROLE.FIXER, label: 'Фіксер' },
      { value: MEMBER_ROLE.RELEASER, label: 'Релізер' },
      { value: MEMBER_ROLE.ROLE_BREAKER, label: 'Розбивач ролей' },
      { value: MEMBER_ROLE.SUB, label: 'Перекладач' },
    ];
  }
}
