import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { Vote, PollAnime, PollAnimeWithoutVotes, Result } from './interfaces';
import { CreateAnimeData } from './data';

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
          .exec(),
        this.pollAnimeModel
          .find({ isOngoing: false }, { votes: 0, __v: 0 })
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

  async deleteTeamAnime(id: string): Promise<boolean> {
    this.pollAnimeModel.deleteOne({ _id: id });
    return true;
  }

  async getVoteResult(): Promise<Result[]> {
    try {
      const animes: PollAnime[] = await this.pollAnimeModel
        .find()
        .populate('votes')
        .exec();

      const animesWithVotes: Result[] = animes
        .sort((a, b) => b.getTotalVotes() - a.getTotalVotes())
        .map((anime) => ({
          anime,
          voteCount: anime.getTotalVotes(),
        }));

      return animesWithVotes;
    } catch (error) {
      throw new HttpException(
        'Не вдалося отримати результати голосування',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async vote(userName: string, animeIds: string[]): Promise<Vote[]> {
    const votes: Vote[] = [];

    try {
      const existingVote = await this.voteModel.findOne({ userName }).exec();
      if (existingVote) {
        throw new HttpException('Ви вже проголосували', HttpStatus.BAD_REQUEST);
      }

      const animes = await this.pollAnimeModel
        .find({ _id: { $in: animeIds } })
        .exec();

      if (animes.length !== animeIds.length) {
        throw new HttpException(
          'Такого аніме немає в списку',
          HttpStatus.BAD_REQUEST,
        );
      }

      for (const anime of animes) {
        const vote = new this.voteModel({ userName, anime });
        const savedVote = await vote.save();

        await this.pollAnimeModel.findByIdAndUpdate(anime._id, {
          $push: { votes: savedVote._id },
        });
        votes.push(savedVote);
      }

      return votes;
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
