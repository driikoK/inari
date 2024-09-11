import { HttpException, Inject, Injectable } from '@nestjs/common';
import { CreateTrackData } from './data/create-track.data';
import { Model } from 'mongoose';
import { ITrack } from './interfaces/track.interface';
import { INickname } from './interfaces/nickname.interface';
import { determineAnimeSeason } from './helper/season.helper';
import { FilterTrackData } from './data/filter-track.data';

@Injectable()
export class TrackService {
  constructor(
    @Inject('TRACK_MODEL') private readonly trackModel: Model<ITrack>,
    @Inject('NICKNAME_MODEL') private readonly userModel: Model<INickname>,
  ) {}

  async getTracks(filter: FilterTrackData) {
    return this.trackModel.find(filter);
  }

  async deleteTrack(id: string) {
    const track = await this.trackModel.findOne({
      _id: id,
    });

    if (track) {
      const user = await this.userModel
        .findOne({
          nickname: track.nickname,
        })
        .exec();

      if (user) {
        await this.userModel.updateOne<INickname>(
          {
            nickname: track.nickname,
          },
          {
            coin: Number(user.coin) - Number(track.coin),
          },
        );
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

  async tracks(tracks: CreateTrackData[]) {
    for (const track of tracks) {
      const user = await this.userModel
        .findOne({
          nickname: track.nickname,
        })
        .exec();

      if (!user) {
        throw new HttpException('User not found', 406);
      }

      await this.trackModel.create({
        ...track,
        season: determineAnimeSeason(
          new Date().getMonth(),
          new Date().getFullYear(),
        ),
      });

      await this.userModel.updateOne<INickname>(
        {
          nickname: track.nickname,
        },
        {
          coin: Number(user.coin) + Number(track.coin),
          types: user.types.includes(track.typeRole)
            ? user.types
            : [...user.types, track.typeRole],
        },
      );
    }
  }
}
