import { Model } from 'mongoose';
import { Inject, Injectable } from '@nestjs/common';

import { CreateTrackData, MemberInfo } from './data/create-track.data';
import { FilterTrackData } from './data/filter-track.data';
import { UserService } from './users.service';
import { ITrack } from './interfaces/track.interface';
import { MEMBER_ROLE, MULTIPLIER } from './enums/types.enum';
import { SettingsService } from './settings.service';
import { UpdateTrackData } from './data/update-track.data';

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

      const existedSeasonIndex = user.seasons.findIndex(
        (season) =>
          season.season === track.season && season.year === track.year,
      );

      user.seasons[existedSeasonIndex].coins -= track.coins;

      if (user) {
        const updatedUser = {
          nickname: user.nickname,
          coins: Number(user.coins) - Number(track.coins),
          types: user.types,
          seasons: user.seasons,
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

  async updateTrack(id: string, track: UpdateTrackData) {
    await this.trackModel.updateOne(
      {
        _id: id,
      },
      {
        $set: track,
      },
    );

    const updatedTrack = await this.trackModel.findOne({
      _id: id,
    });

    return updatedTrack;
  }

  private getCoinsWithMultipliers(
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

  private addAdditionalCoinsToTranslator(track: CreateTrackData, role: string) {
    const subIndex = track.membersInfo.findIndex(
      (member) => member.typeRole === MEMBER_ROLE.SUB,
    );
    track.membersInfo[subIndex].coins +=
      this.settingsService.getCoins()[track.titleType][role];
  }

  async createTrack(track: CreateTrackData) {
    if (track.isGiveEditorCoins)
      this.addAdditionalCoinsToTranslator(track, 'editor');
    if (track.isGiveTypesetterCoins)
      this.addAdditionalCoinsToTranslator(track, 'typesetter');

    for (const member of track.membersInfo) {
      const user = await this.usersService.findUser(member.nickname);

      const memberWithMultipliers = this.getCoinsWithMultipliers(track, member);

      await this.trackModel.create({
        ...memberWithMultipliers,
        ...track,
        year: Number(track.year),
      });

      const existedSeasonIndex = user.seasons.findIndex(
        (season) =>
          season.season === track.season && season.year === track.year,
      );

      if (existedSeasonIndex !== -1) {
        user.seasons[existedSeasonIndex].coins += memberWithMultipliers.coins;
      } else {
        user.seasons.push({
          season: track.season,
          year: track.year,
          coins: memberWithMultipliers.coins,
        });
      }

      const updatedUser = {
        nickname: member.nickname,
        coins: Number(user.coins) + Number(memberWithMultipliers.coins),
        types: user.types.includes(member.typeRole)
          ? user.types
          : [...user.types, member.typeRole],
        seasons: user.seasons,
      };

      await this.usersService.updateUser(updatedUser);
    }

    return 'Success';
  }
}
