import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isValidObjectId, Model } from 'mongoose';
import { CoinsTotal, IMember } from './interfaces/members.interface.js';
import { MemberData } from './data/member.data.js';
import { MEMBER_KIND, MEMBER_ROLE } from '../shared/index.js';
import { CoinsTotalFilterData } from './data/coins-total.data.js';
import { MemberFilterData, UNMARKED_KIND } from './data/filter-members.data.js';
import { UpdateMemberData } from './data/update-member.data.js';

@Injectable()
export class MembersService {
  constructor(
    @Inject('MEMBER_MODEL') private readonly memberModel: Model<IMember>,
  ) {}

  async findAll(filter: MemberFilterData): Promise<IMember[]> {
    const query: any = { deletedAt: null };

    if (filter.id) {
      query._id = filter.id;
    }

    if (filter.role) {
      query.types = { $in: [filter.role] };
    }

    if (filter.kind) {
      query.kind = filter.kind === UNMARKED_KIND ? null : filter.kind;
    }

    if (filter.season && filter.year) {
      query.seasons = {
        $elemMatch: { season: filter.season, year: filter.year },
      };
    }

    return this.memberModel.find(query).sort({ nickname: 1 });
  }

  async getCoinsTotal({
    season,
    year,
    includeGuests,
  }: CoinsTotalFilterData): Promise<CoinsTotal> {
    const bySeason = !!season && !!year;

    const [result] = await this.memberModel.aggregate<CoinsTotal>([
      {
        $match: {
          deletedAt: null,
          ...(!includeGuests && { kind: { $ne: MEMBER_KIND.GUEST } }),
          ...(bySeason && { seasons: { $elemMatch: { season, year } } }),
        },
      },
      {
        $project: {
          kind: 1,
          coins: bySeason
            ? {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$seasons',
                        as: 'item',
                        cond: {
                          $and: [
                            { $eq: ['$$item.season', season] },
                            { $eq: ['$$item.year', year] },
                          ],
                        },
                      },
                    },
                    as: 'item',
                    in: '$$item.coins',
                  },
                },
              }
            : '$coins',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$coins' },
          unmarkedCount: {
            $sum: {
              $cond: [{ $eq: [{ $ifNull: ['$kind', null] }, null] }, 1, 0],
            },
          },
        },
      },
    ]);

    if (!result) return { total: 0, unmarkedCount: 0 };

    return {
      total: Math.round(result.total * 1000) / 1000,
      unmarkedCount: result.unmarkedCount,
    };
  }

  async createMember(member: MemberData): Promise<IMember> {
    const restored = await this.memberModel.findOneAndUpdate(
      { nickname: member.nickname, deletedAt: { $ne: null } },
      {
        $unset: { deletedAt: 1 },
        ...(member.kind && { $set: { kind: member.kind } }),
        $addToSet: { types: { $each: member.types ?? [] } },
      },
      { new: true },
    );

    if (restored) return restored;

    if (member.coins === undefined) member.coins = 0;

    return this.memberModel.create(member);
  }

  async deleteMember(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) {
      throw new HttpException('Невірний id', HttpStatus.BAD_REQUEST);
    }

    const result = await this.memberModel.updateOne(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('Нікнейм не знайдено');
    }

    return true;
  }

  async updateKind(id: string, kind: MEMBER_KIND): Promise<IMember> {
    if (!isValidObjectId(id)) {
      throw new HttpException('Невірний id', HttpStatus.BAD_REQUEST);
    }

    const member = await this.memberModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { kind } },
      { new: true },
    );

    if (!member) {
      throw new NotFoundException('Нікнейм не знайдено');
    }

    return member;
  }

  async updateMember(member: UpdateMemberData) {
    await this.memberModel.updateOne(
      { nickname: member.nickname },
      { ...member, coins: member.coins < 0 ? 0 : member.coins },
    );

    return this.findMember(member.nickname);
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
      { value: MEMBER_ROLE.SOUND, label: 'Звукорежисер' },
      { value: MEMBER_ROLE.EDITOR, label: 'Редактор' },
      { value: MEMBER_ROLE.FIXER, label: 'Контроль якості' },
      { value: MEMBER_ROLE.RELEASER, label: 'Релізер' },
      { value: MEMBER_ROLE.ROLE_BREAKER, label: 'Розбивач ролей' },
      { value: MEMBER_ROLE.SUB, label: 'Перекладач' },
    ];
  }
}
