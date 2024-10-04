import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { IMember } from './interfaces/nickname.interface';
import { MemberData } from './data/member.data';
import { MEMBER_ROLE } from './enums/types.enum';
import { MemberFilterData } from './data/filter-members.data';

@Injectable()
export class MembersService {
  constructor(
    @Inject('MEMBER_MODEL') private readonly memberModel: Model<IMember>,
  ) {}

  async findAll(filter: MemberFilterData): Promise<IMember[]> {
    const query: any = {};

    if (filter.id) {
      query._id = filter.id;
    }

    if (filter.role) {
      query.types = { $in: [filter.role] };
    }

    if (filter.season && filter.year) {
      query.seasons = {
        $elemMatch: { season: filter.season, year: filter.year },
      };
    }

    return this.memberModel.find(query);
  }

  createMember(member: MemberData): Promise<IMember> {
    return this.memberModel.create(member);
  }

  async updateMember(member: MemberData) {
    await this.memberModel.updateOne({ nickname: member.nickname }, member);
  }

  async findMember(nickname: string) {
    const member = await this.memberModel
      .findOne({
        nickname,
      })
      .exec();

    if (!member) {
      throw new HttpException('User not found', 406);
    }

    return member;
  }

  async findMemberById(id: string) {
    const member = await this.memberModel
      .findOne({
        _id: id,
      })
      .exec();

    if (!member) {
      throw new HttpException('User not found', 406);
    }

    return member;
  }

  getAllRoles() {
    return [
      { value: MEMBER_ROLE.DIRECTOR, label: 'Куратор' },
      { value: MEMBER_ROLE.DUB, label: 'Дабер' },
      { value: MEMBER_ROLE.TYPESETTER, label: 'Тайпсеттер' },
      { value: MEMBER_ROLE.SOUND, label: 'Звукарь' },
      { value: MEMBER_ROLE.EDITOR, label: 'Редактор' },
      { value: MEMBER_ROLE.FIXER, label: 'Фіксер' },
      { value: MEMBER_ROLE.RELEASER, label: 'Релізер' },
      { value: MEMBER_ROLE.ROLE_BREAKER, label: 'Розбивач ролей' },
      { value: MEMBER_ROLE.SUB, label: 'Перекладач' },
    ];
  }
}
