import { Inject, Injectable } from '@nestjs/common';
import { CreateTrackData, MemberInfo } from './data/create-track.data';
import { Model } from 'mongoose';
import { ITrack } from './interfaces/track.interface';
import { determineAnimeSeason } from './helper/season.helper';
import { FilterTrackData } from './data/filter-track.data';
import { UserService } from './users.service';
import { MULTIPLIERS } from './enums/types.enum';

@Injectable()
export class TrackService {
  constructor(
    @Inject('TRACK_MODEL') private readonly trackModel: Model<ITrack>,
    private readonly usersService: UserService,
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
          coin: Number(user.coin) - Number(track.coin),
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
    if (member.isGuest && member.coin) member.coin = member.coin / 2;

    let additionalCoins = 0;

    if (multipliers.isFast) {
      additionalCoins += member.coin * MULTIPLIERS.FAST;
    }
    if (multipliers.isOngoing) {
      additionalCoins += member.coin * MULTIPLIERS.ONGOING;
    }
    if (multipliers.isPriority) {
      additionalCoins += member.coin * MULTIPLIERS.PRIORITY;
    }
    if (multipliers.isInTime) {
      additionalCoins += member.coin * MULTIPLIERS.IN_TIME;
    }

    member.coin += additionalCoins;

    return member;
  }

  async createTrack(track: CreateTrackData) {
    for (const member of track.membersInfo) {
      const user = await this.usersService.findUser(member.nickname);

      const memberWithMultipliers = this.getCoinsWithMultipliers(track, member);
      const date = new Date();

      await this.trackModel.create({
        ...memberWithMultipliers,
        season: determineAnimeSeason(date.getMonth(), date.getFullYear()),
      });

      const updatedUser = {
        nickname: member.nickname,
        coin: Number(user.coin) + Number(member.coin),
        types: user.types.includes(member.typeRole)
          ? user.types
          : [...user.types, member.typeRole],
      };

      await this.usersService.updateUser(updatedUser);
    }
  }
}
