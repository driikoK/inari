import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { IVote, IAnime } from './interfaces';
import { AnimeData, CreateAnimeData } from './data';

@Injectable()
export class PollsService {
  constructor(
    @Inject('POLL_ANIME_MODEL') private pollAnimeModel: Model<IAnime>,
    @Inject('VOTE_MODEL') private voteModel: Model<IVote>,
  ) {}

  async createAnime(animeTemplate: AnimeData): Promise<IAnime> {
    try {
      const anime = new this.pollAnimeModel(animeTemplate);
      return await anime.save();
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

  async findAll(): Promise<{ ongoings: IAnime[]; olds: IAnime[] }> {
    try {
      const [ongoings, olds] = await Promise.all([
        this.pollAnimeModel.find({ isOngoing: true }).exec(),
        this.pollAnimeModel.find({ isOngoing: false }).exec(),
      ]);
      return { ongoings, olds };
    } catch (error) {
      throw new HttpException(
        'Не вдалося отримати список аніме',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getVoteResult(): Promise<{ anime: IAnime; voteCount: number }[]> {
    try {
      const animeWithVotes = await this.pollAnimeModel
        .find()
        .populate('votes')
        .exec();

      return animeWithVotes
        .sort((a, b) => b.getTotalVotes() - a.getTotalVotes())
        .map((anime) => ({
          anime,
          voteCount: anime.getTotalVotes(),
        }));
    } catch (error) {
      throw new HttpException(
        'Не вдалося отримати результати голосування',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async vote(userName: string, animeIds: string[]): Promise<IVote[]> {
    const votes: IVote[] = [];

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
