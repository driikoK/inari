import { Inject, Injectable } from '@nestjs/common';
import { CreateTrackData } from './data/create-track.data';
import { Model } from 'mongoose';
import { ITrack } from './interfaces/track.interface';
import { INickname } from './interfaces/nickname.interface';

@Injectable()
export class TrackService {
  constructor(
    @Inject('TRACK_MODEL') private readonly trackModel: Model<ITrack>,
    @Inject('NICKNAME_MODEL') private readonly userModel: Model<INickname>,
  ) {}

  async tracks(tracks: CreateTrackData[]) {
    for (const track of tracks) {
      const user = await this.userModel
        .findOne({
          nickname: track.nickname,
        })
        .exec();

      if (user) {
        await this.trackModel.create(track);

        await this.userModel.updateOne<INickname>(
          {
            nickname: track.nickname,
          },
          {
            coin: Number(user.coin) + Number(track.coin),
          },
        );
      }
    }
  }
}
