import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';

import { CreateTrackData, MemberInfo } from './data/create-track.data';
import { FilterTrackData } from './data/filter-track.data';
import { UserService } from './users.service';
import { ITrack } from './interfaces/track.interface';
import { determineAnimeSeason } from './helper/season.helper';
import { MEMBER_ROLE, MULTIPLIER } from './enums/types.enum';
import { SettingsService } from './settings.service';

@Injectable()
export class TrackService {
  constructor(
    @Inject('TRACK_MODEL') private readonly trackModel: Model<ITrack>,
    private readonly usersService: UserService,
    private readonly settingsService: SettingsService,
  ) {}

  async getTracks(filter: FilterTrackData) {
    return this.trackModel.find(filter);
  }

  async deleteTrack(id: string) {
    const track = await this.trackModel.findOne({
      _id: id,
    });

    if (track) {
      const user = await this.usersService.findUser(track.nickname);

      if (user) {
        const updatedUser = {
          nickname: user.nickname,
          coin: Number(user.coin) - Number(track.coins),
          types: user.types,
        };

        await this.usersService.updateUser(updatedUser);
      }

      await this.trackModel.deleteOne({
        _id: id,
      });
    }

    return;
  }

  async getTrackSeasons() {
    return this.trackModel.aggregate([
      {
        $group: {
          _id: '$season',
          count: { $sum: 1 },
        },
      },
    ]);
  }

  async updateTrack(track: CreateTrackData) {}

  getCoinsWithMultipliers(
    multipliers: Omit<CreateTrackData, 'membersInfo'>,
    member: MemberInfo,
  ) {
    if (member.isGuest && member.coins) member.coins = member.coins / 2;

    let additionalCoins = 0;

    if (multipliers.isFast) {
      additionalCoins += member.coins * MULTIPLIER.FAST;
    }
    if (multipliers.isOngoing) {
      additionalCoins += member.coins * MULTIPLIER.ONGOING;
    }
    if (multipliers.isPriority) {
      additionalCoins += member.coins * MULTIPLIER.PRIORITY;
    }
    if (multipliers.isInTime) {
      additionalCoins += member.coins * MULTIPLIER.IN_TIME;
    }

    member.coins += additionalCoins;

    return member;
  }

  async createTrack(track: CreateTrackData) {
    const editor = track.membersInfo.find(
      (member) => member.typeRole === MEMBER_ROLE.EDITOR,
    );

    // ** add additional coins to translator when team doesn't have an editor
    if (!editor) {
      const subIndex = track.membersInfo.findIndex(
        (member) => member.typeRole === MEMBER_ROLE.SUB,
      );
      track.membersInfo[subIndex].coins +=
        this.settingsService.getCoins()[track.titleType].editor;
    }

    for (const member of track.membersInfo) {
      const user = await this.usersService.findUser(member.nickname);

      const memberWithMultipliers = this.getCoinsWithMultipliers(track, member);
      const date = new Date();

      await this.trackModel.create({
        ...memberWithMultipliers,
        season: determineAnimeSeason(date.getMonth(), date.getFullYear()),
        currentEpisode: track.currentEpisode,
        nameTitle: track.nameTitle,
      });

      const updatedUser = {
        nickname: member.nickname,
        coin: Number(user.coin) + Number(member.coins),
        types: user.types.includes(member.typeRole)
          ? user.types
          : [...user.types, member.typeRole],
      };

      await this.usersService.updateUser(updatedUser);
    }
  }
}
