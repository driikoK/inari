import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { Vote, PollAnime, PollAnimeWithoutVotes, Result } from './interfaces';
import { CreateAnimeData, VoteData } from './data';

@Injectable()
export class PollsService {
  constructor(
    @Inject('POLL_ANIME_MODEL') private pollAnimeModel: Model<PollAnime>,
    @Inject('VOTE_MODEL') private voteModel: Model<Vote>,
  ) {}

  async createAnime(animeData: CreateAnimeData): Promise<CreateAnimeData> {
    try {
      await this.pollAnimeModel.create(animeData);

      return animeData;
    } catch (error) {
      throw new HttpException(
        'Не вдалося створити аніме',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createManyAnimes(animeList: CreateAnimeData[]): Promise<void> {
    try {
      await this.pollAnimeModel.insertMany(animeList);
    } catch (error) {
      throw new HttpException(
        'Не вдалося створити список аніме',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(): Promise<{
    ongoings: PollAnimeWithoutVotes[];
    olds: PollAnimeWithoutVotes[];
  }> {
    try {
      const [ongoings, olds] = await Promise.all([
        this.pollAnimeModel
          .find({ isOngoing: true }, { votes: 0, __v: 0 })
          .sort({ _id: -1 })
          .exec(),
        this.pollAnimeModel
          .find({ isOngoing: false }, { votes: 0, __v: 0 })
          .sort({ _id: -1 })
          .exec(),
      ]);
      return { ongoings, olds };
    } catch (error) {
      throw new HttpException(
        'Не вдалося отримати список аніме',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteAnime(id: string): Promise<boolean> {
    await this.pollAnimeModel.deleteOne({ _id: id });
    return true;
  }

  async getVoteResult(): Promise<Result[]> {
    try {
      const votes = await this.voteModel.aggregate([
        { $unwind: '$votes' },
        {
          $lookup: {
            from: 'poll_animes',
            localField: 'votes.animeId',
            foreignField: '_id',
            as: 'animeDetails',
          },
        },
        { $unwind: '$animeDetails' },
        {
          $group: {
            _id: '$votes.animeId',
            animeName: { $first: '$animeDetails.name' },
            link: { $first: '$animeDetails.link' },
            votes: {
              $push: { userName: '$userName', roles: '$votes.roles' },
            },
            totalVotes: { $sum: 1 },
          },
        },
        { $sort: { totalVotes: -1, _id: 1 } },
        {
          $project: {
            _id: 0,
            animeId: '$_id',
            animeName: 1,
            link: 1,
            votes: 1,
            totalVotes: 1,
          },
        },
      ]);

      return votes;
    } catch (error) {
      throw new HttpException(
        'Не вдалося отримати результати голосування',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async vote(userName: string, voteData: VoteData): Promise<boolean> {
    try {
      const existingVote = await this.voteModel.findOne({ userName }).exec();

      if (existingVote?.userName) {
        await this.voteModel.updateOne({ userName }, { userName, ...voteData });
      } else {
        await this.voteModel.create({ userName, ...voteData });
      }

      return true;
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new HttpException(
            'Не вдалося проголосувати',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
    }
  }

  async clearAllAnimesAndVotes(): Promise<void> {
    try {
      await Promise.all([
        this.voteModel.deleteMany({}),
        this.pollAnimeModel.deleteMany({}),
      ]);
    } catch (error) {
      throw new HttpException(
        'Не можливо очистити списки',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
