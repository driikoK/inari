import { isValidObjectId, Model } from 'mongoose';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import { formatCrumbs } from '../budget/calc.js';
import { CrumbAuditService } from '../budget/crumb-audit.service.js';
import {
  type CrumbAuditItem,
  type CrumbsChange,
  describeTrack,
  formatSignedCrumbs,
  trackSnapshot,
} from '../budget/crumbs.js';
import { AUDIT_KIND } from '../budget/enums/index.js';
import { MembersService } from '../members/members.service.js';
import { MEMBER_ROLE, pick, type SEASON } from '../shared/index.js';
import { DictionariesService } from '../dictionaries/dictionaries.service.js';
import { UsersService } from '../users/users.service.js';
import { UpdateTrackData } from './data/update-track.data.js';
import { CreateTrackData, MemberInfo } from './data/create-track.data.js';
import { FilterTrackData } from './data/filter-track.data.js';
import {
  ITrack,
  ITracksWithPagination,
  Multipliers,
  SeasonCoins,
} from './interfaces/track.interface.js';
import { MULTIPLIER } from './enums/types.enum.js';
import { LastTracksData } from './data/last-tracks.js';

@Injectable()
export class TrackService {
  private readonly logger = new Logger(TrackService.name);

  constructor(
    @Inject('TRACK_MODEL') private readonly trackModel: Model<ITrack>,
    private readonly membersService: MembersService,
    private readonly dictionariesService: DictionariesService,
    private readonly usersService: UsersService,
    private readonly crumbAudit: CrumbAuditService,
  ) {}

  async findAll(filter: FilterTrackData): Promise<ITracksWithPagination> {
    const { page = 1, perPage = 10, ...queryFilter } = filter;

    const tracks = await this.trackModel
      .find(queryFilter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const total = await this.trackModel.countDocuments(queryFilter);

    return {
      data: tracks,
      page: Number(page),
      perPage: Number(perPage),
      total: Number(total),
    };
  }

  // Puts back what a change took, when the track write that went with it failed
  private async revert(change: CrumbsChange, actor: string) {
    try {
      await this.membersService.changeCoins(
        change.nickname,
        {
          season: change.season,
          year: change.year,
          delta: -change.delta,
          actor,
        },
        { guard: false },
      );
    } catch (error) {
      this.logger.error(
        `Не вдалося повернути крихти нікнейма ${change.nickname}`,
        error,
      );
    }
  }

  private roleLabel(role: string) {
    return (
      this.membersService.getAllRoles().find(({ value }) => value === role)
        ?.label ?? role
    );
  }

  private async findTrack(id: string): Promise<ITrack> {
    if (!isValidObjectId(id)) {
      throw new HttpException('Невірний id', HttpStatus.BAD_REQUEST);
    }

    const track = await this.trackModel.findById(id);

    if (!track)
      throw new HttpException('Трек не існує', HttpStatus.BAD_REQUEST);

    return track;
  }

  async delete(id: string, actor: string) {
    const track = await this.findTrack(id);
    const before = trackSnapshot(track);

    const change = await this.membersService.changeCoins(track.nickname, {
      season: track.season,
      year: track.year,
      delta: -track.coins,
      actor,
    });

    try {
      await this.trackModel.deleteOne({ _id: id });
    } catch (error) {
      await this.revert(change, actor);

      throw error;
    }

    await this.crumbAudit.record(
      AUDIT_KIND.TRACK_DELETED,
      actor,
      `Видалено трек ${describeTrack(before, (role) => this.roleLabel(role))}`,
      [{ change, entryId: id, before, after: null }],
    );
  }

  private calculateAdditionalCoins = (
    multipliers: Partial<Multipliers>,
    coins: number,
  ): number => {
    let additionalCoins = 0;

    if (multipliers.isOngoing) {
      additionalCoins += coins * MULTIPLIER.ONGOING;
    }
    if (multipliers.isPriority) {
      additionalCoins += coins * MULTIPLIER.PRIORITY;
    }
    if (multipliers.isInTime) {
      additionalCoins += coins * MULTIPLIER.IN_TIME;
    }

    return additionalCoins;
  };

  private getCoinsForTrack(track: ITrack, newTrack: UpdateTrackData) {
    if (track.isGuest && newTrack.coins) {
      newTrack.coins = newTrack.coins * MULTIPLIER.IS_GUEST;
    }

    newTrack.coins += this.calculateAdditionalCoins(track, newTrack.coins);

    return newTrack;
  }

  async update(
    id: string,
    track: UpdateTrackData,
    actor: string,
  ): Promise<ITrack> {
    const trackToUpdate = await this.findTrack(id);
    const before = trackSnapshot(trackToUpdate);

    const updatedValues = this.getCoinsForTrack(trackToUpdate, track);
    const delta = updatedValues.coins - trackToUpdate.coins;

    const change =
      delta === 0
        ? null
        : await this.membersService.changeCoins(trackToUpdate.nickname, {
            season: trackToUpdate.season,
            year: trackToUpdate.year,
            delta,
            actor,
          });

    let updatedTrack: ITrack;

    try {
      updatedTrack = await this.trackModel.findOneAndUpdate(
        { _id: id },
        { $set: updatedValues },
        { new: true },
      );
    } catch (error) {
      if (change) await this.revert(change, actor);

      throw error;
    }

    if (change) {
      const after = trackSnapshot(updatedTrack);

      await this.crumbAudit.record(
        AUDIT_KIND.TRACK_UPDATED,
        actor,
        `Змінено трек «${after.nameTitle}» еп. ${after.currentEpisode}, ${after.nickname}: ${formatCrumbs(before.coins)} → ${formatCrumbs(after.coins)} крихт`,
        [{ change, entryId: id, before, after }],
      );
    }

    return updatedTrack;
  }

  private getCoinsWithMultipliers(
    multipliers: Omit<CreateTrackData, 'membersInfo'>,
    member: MemberInfo,
  ) {
    if (member.isGuest && member.coins) member.coins = member.coins / 2;

    const allMultipliers = {
      ...pick(multipliers, ['isOngoing', 'isPriority', 'isInTime']),
      isGuest: member.isGuest,
    };
    member.coins += this.calculateAdditionalCoins(allMultipliers, member.coins);

    return member;
  }

  private addAdditionalCoinsToTranslator(track: CreateTrackData, role: string) {
    const subIndex = track.membersInfo.findIndex(
      (member) => member.typeRole === MEMBER_ROLE.SUB,
    );

    track.membersInfo[subIndex].coins +=
      this.dictionariesService.getCoins()[track.titleType][role];
  }

  async create(track: CreateTrackData, actor: string): Promise<string> {
    const currentUser = await this.usersService.findOneByUsername(
      track.username,
    );

    if (!currentUser)
      throw new HttpException('Такого юзера не існує', HttpStatus.BAD_REQUEST);

    for (const { nickname } of track.membersInfo) {
      const member = await this.membersService.findMember(nickname);

      if (member.deletedAt) {
        throw new HttpException(
          `Нікнейм «${nickname}» видалено зі списку`,
          HttpStatus.CONFLICT,
        );
      }
    }

    if (track.isGiveEditorCoins)
      this.addAdditionalCoinsToTranslator(track, MEMBER_ROLE.EDITOR);
    if (track.isGiveTypesetterCoins)
      this.addAdditionalCoinsToTranslator(track, MEMBER_ROLE.TYPESETTER);

    const year = Number(track.year);
    const done: { id: string; item: CrumbAuditItem }[] = [];

    try {
      for (const member of track.membersInfo) {
        const memberWithMultipliers = this.getCoinsWithMultipliers(
          track,
          member,
        );

        const created = await this.trackModel.create({
          ...memberWithMultipliers,
          ...track,
          year,
        });
        const id = String(created._id);

        let change: CrumbsChange;

        try {
          change = await this.membersService.changeCoins(member.nickname, {
            season: track.season,
            year,
            delta: memberWithMultipliers.coins,
            role: member.typeRole,
            actor,
          });
        } catch (error) {
          await this.trackModel.deleteOne({ _id: id });

          throw error;
        }

        done.push({
          id,
          item: {
            change,
            entryId: id,
            before: null,
            after: trackSnapshot({
              nickname: member.nickname,
              nameTitle: track.nameTitle,
              currentEpisode: track.currentEpisode,
              typeRole: member.typeRole,
              season: track.season,
              year,
              coins: memberWithMultipliers.coins,
            }),
          },
        });
      }
    } catch (error) {
      for (const { id, item } of done.reverse()) {
        await this.revert(item.change, actor);
        await this.trackModel.deleteOne({ _id: id });
      }

      throw error;
    }

    await this.crumbAudit.record(
      AUDIT_KIND.TRACK_CREATED,
      actor,
      `Додано трек «${track.nameTitle}» еп. ${track.currentEpisode}: ${done
        .map(
          ({ item }) =>
            `${item.change.nickname} ${formatSignedCrumbs(item.change.delta)}`,
        )
        .join(', ')}`,
      done.map(({ item }) => item),
    );

    return 'Success';
  }

  async getCoinsBySeason(): Promise<SeasonCoins[]> {
    const groups = await this.trackModel.aggregate<{
      _id: { season: SEASON; year: number };
      coins: number;
    }>([
      {
        $group: {
          _id: { season: '$season', year: '$year' },
          coins: { $sum: '$coins' },
        },
      },
    ]);

    return groups.map(({ _id, coins }) => ({
      season: _id.season,
      year: _id.year,
      coins: Math.round(coins * 1000) / 1000,
    }));
  }

  async getLastTracks(data: LastTracksData): Promise<ITrack[]> {
    const { titleName, episode } = data;
    const queryFilter = { nameTitle: titleName, currentEpisode: episode - 1 };

    const tracks = await this.trackModel
      .find(queryFilter)
      .sort({ createdAt: -1 });

    return tracks;
  }
}
