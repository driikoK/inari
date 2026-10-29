import {
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isValidObjectId, Model } from 'mongoose';
import {
  CoinsDelta,
  CoinsTotal,
  IMember,
  MyCoins,
} from './interfaces/members.interface.js';
import { formatCrumbs, seasonLabel } from '../budget/calc.js';
import { CrumbAuditService } from '../budget/crumb-audit.service.js';
import { type CrumbsChange, memberSnapshot } from '../budget/crumbs.js';
import { AUDIT_KIND } from '../budget/enums/index.js';
import { seasonOfDay, todayInKyiv } from '../projects/layout.js';
import { MemberData } from './data/member.data.js';
import { MEMBER_KIND, MEMBER_ROLE, type SEASON } from '../shared/index.js';
import { CoinsTotalFilterData } from './data/coins-total.data.js';
import { MemberFilterData, UNMARKED_KIND } from './data/filter-members.data.js';
import { UpdateMemberData } from './data/update-member.data.js';

const roundCoins = (coins = 0) => Math.round(coins * 1000) / 1000;

// Counters are floats with three digits, so "enough" tolerates the noise
const COINS_EPSILON = 0.0005;

const sameSeason =
  (season: SEASON, year: number) => (item: { season: string; year: number }) =>
    item.season === season && item.year === year;

@Injectable()
export class MembersService {
  constructor(
    @Inject('MEMBER_MODEL') private readonly memberModel: Model<IMember>,
    private readonly crumbAudit: CrumbAuditService,
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

  async createMember(member: MemberData, actor: string): Promise<IMember> {
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

    const coins = member.coins ?? 0;
    const created = await this.memberModel.create({
      ...member,
      coins,
      crumbsAuditedAt: new Date(),
    });

    if (coins > 0) {
      const { season, year } = seasonOfDay(todayInKyiv());

      await this.crumbAudit.record(
        AUDIT_KIND.MEMBER_CREATED,
        actor,
        `Додано нікнейм ${member.nickname} з ${formatCrumbs(coins)} крихтами`,
        [
          {
            change: {
              nickname: member.nickname,
              season,
              year,
              delta: coins,
              coins,
              seasonCoins: 0,
            },
            before: null,
            after: memberSnapshot({
              nickname: member.nickname,
              coins,
              seasons: [],
            }),
          },
        ],
      );
    }

    return created;
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

  async updateMember(member: UpdateMemberData, actor: string) {
    const { nickname, types, seasons } = member;
    const coins = member.coins < 0 ? 0 : member.coins;
    const { season, year } = seasonOfDay(todayInKyiv());

    await this.claimOpening(nickname, actor, season, year);

    const before = await this.memberModel
      .findOneAndUpdate(
        { nickname },
        {
          $set: { coins, ...(types && { types }), ...(seasons && { seasons }) },
        },
        { new: false },
      )
      .lean<IMember>();

    if (!before) throw new HttpException('User not found', 406);

    const after = memberSnapshot({
      nickname,
      coins,
      seasons: seasons ?? before.seasons ?? [],
    });
    const was = memberSnapshot({
      nickname,
      coins: before.coins ?? 0,
      seasons: before.seasons ?? [],
    });

    if (JSON.stringify(after) !== JSON.stringify(was)) {
      const current = after.seasons.find(sameSeason(season, year));

      await this.crumbAudit.record(
        AUDIT_KIND.MEMBER_ADJUSTED,
        actor,
        `Змінено крихти ${nickname}: ${formatCrumbs(was.coins)} → ${formatCrumbs(after.coins)}`,
        [
          {
            change: {
              nickname,
              season,
              year,
              delta: after.coins - was.coins,
              coins: after.coins,
              seasonCoins: current?.coins ?? 0,
            },
            before: was,
            after,
          },
        ],
      );
    }

    return this.findMember(nickname);
  }

  // Adds crumbs to the total and to one season in single atomic updates, so
  // two requests at once can never overwrite each other. Both counters must
  // stay non-negative unless the caller is undoing its own change.
  async changeCoins(
    nickname: string,
    request: CoinsDelta,
    { guard = true } = {},
  ): Promise<CrumbsChange> {
    const { season, year, delta, actor } = request;

    await this.claimOpening(nickname, actor, season, year);

    const need = delta < 0 && guard ? -delta - COINS_EPSILON : null;
    let updated = await this.applyCoins(nickname, request, need);

    // A season entry that appeared between the two steps makes the second
    // one miss, so look once more
    if (!updated && delta > 0) {
      updated = await this.applyCoins(nickname, request, need);
    }

    if (!updated) return this.refuseCoins(nickname, season, year, delta);

    return {
      nickname,
      season,
      year,
      delta,
      coins: updated.coins,
      seasonCoins: updated.seasons.find(sameSeason(season, year))?.coins ?? 0,
    };
  }

  private async applyCoins(
    nickname: string,
    { season, year, delta, role }: CoinsDelta,
    need: number | null,
  ) {
    const enough = need === null ? {} : { coins: { $gte: need } };
    const types = role ? { $addToSet: { types: role } } : {};

    const bumped = await this.memberModel
      .findOneAndUpdate(
        {
          nickname,
          ...enough,
          seasons: { $elemMatch: { season, year, ...enough } },
        },
        { $inc: { coins: delta, 'seasons.$.coins': delta }, ...types },
        { new: true },
      )
      .lean<IMember>();

    if (bumped || delta < 0) return bumped;

    return this.memberModel
      .findOneAndUpdate(
        { nickname, seasons: { $not: { $elemMatch: { season, year } } } },
        {
          $inc: { coins: delta },
          $push: { seasons: { season, year, coins: delta } },
          ...types,
        },
        { new: true },
      )
      .lean<IMember>();
  }

  private async refuseCoins(
    nickname: string,
    season: SEASON,
    year: number,
    delta: number,
  ): Promise<never> {
    const member = await this.memberModel.findOne({ nickname }).lean<IMember>();

    if (!member) throw new HttpException('User not found', 406);

    if (delta > 0) {
      throw new ConflictException(
        'Не вдалося змінити крихти, спробуйте ще раз',
      );
    }

    const have = member.seasons?.find(sameSeason(season, year))?.coins ?? 0;

    throw new ConflictException(
      `Недостатньо крихт у «${nickname}» за сезон ${seasonLabel(season, year)}: є ${formatCrumbs(have)}, потрібно ${formatCrumbs(-delta)}`,
    );
  }

  // The first change of a nickname after the audit began is also the one that
  // writes its opening state. Whoever wins the claim writes it, whatever
  // happens to the change itself.
  private async claimOpening(
    nickname: string,
    actor: string,
    season: SEASON,
    year: number,
  ) {
    const claimed = await this.memberModel
      .findOneAndUpdate(
        { nickname, crumbsAuditedAt: null },
        { $set: { crumbsAuditedAt: new Date() } },
        { new: false },
      )
      .lean<IMember>();

    if (!claimed) return;

    try {
      await this.crumbAudit.recordOpening(
        actor,
        nickname,
        { coins: claimed.coins ?? 0, seasons: claimed.seasons ?? [] },
        season,
        year,
      );
    } catch (error) {
      await this.memberModel.updateOne(
        { nickname },
        { $unset: { crumbsAuditedAt: 1 } },
      );

      throw error;
    }
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

  async findByNickname(nickname: string): Promise<IMember | null> {
    return this.memberModel.findOne({ nickname }).exec();
  }

  async findVisibleByNicknames(nicknames: string[]): Promise<IMember[]> {
    if (nicknames.length === 0) return [];

    return this.memberModel
      .find({ nickname: { $in: nicknames }, deletedAt: null })
      .lean<IMember[]>();
  }

  async getCoinsOf(
    nickname: string | undefined,
    today = todayInKyiv(),
  ): Promise<MyCoins> {
    const { season, year } = seasonOfDay(today);
    const member = nickname
      ? await this.memberModel.findOne({ nickname, deletedAt: null }).exec()
      : null;
    const current = member?.seasons?.find(
      (item) => item.season === season && item.year === year,
    );

    return {
      nickname: member?.nickname ?? null,
      coins: roundCoins(member?.coins),
      currentSeason: { season, year, coins: roundCoins(current?.coins) },
    };
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
