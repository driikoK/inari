import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { IVote } from './interfaces/vote.interface';
import { IAnime } from './interfaces/anime.interface';
import { AnimeData } from './data/anime.data';

@Injectable()
export class PollsService {
  constructor(
    @Inject('ANIME_MODEL') private animeModel: Model<IAnime>,
    @Inject('VOTE_MODEL') private voteModel: Model<IVote>,
  ) {}

  async createAnime(animeTemplate: AnimeData) {
    try {
      const anime = new this.animeModel(animeTemplate);
      return await anime.save();
    } catch (e) {
      throw new Error(e);
    }
  }

  async findAnimeByIsOngoing(isOngoing: boolean): Promise<IAnime[]> {
    try {
      return await this.animeModel.find({ isOngoing }).exec();
    } catch (e) {
      throw new Error(e);
    }
  }

  async getVoteResult(): Promise<{ anime: IAnime; voteCount: number }[]> {
    try {
      const animeWithVotes = await this.animeModel
        .find()
        .populate('votes')
        .exec();

      animeWithVotes.sort((a, b) => b.getTotalVotes() - a.getTotalVotes());

      return animeWithVotes.map((anime) => ({
        anime,
        voteCount: anime.getTotalVotes(),
      }));
    } catch (e) {
      throw new Error(e);
    }
  }

  async vote(userName: string, animeIds: number[]): Promise<IVote[]> {
    try {
      if (!animeIds.length) {
        throw new Error('animeIds is empty');
      }

      if (animeIds.length > 5) {
        throw new Error('The user selected more 5 anime');
      }

      const validUserName = await this.voteModel
        .findOne({ userName: userName.toLowerCase() })
        .exec();

      if (validUserName) {
        throw new Error('The user has already voted');
      }

      const votes: IVote[] = [];

      for (const animeId of animeIds) {
        const anime = await this.animeModel.findById(animeId).exec();

        if (!anime) {
          throw new Error('Anime not found');
        }

        const existingVote = await this.voteModel.findOne({ userName }).exec();

        if (existingVote) {
          continue;
        }

        const vote = new this.voteModel({
          userName: userName.toLowerCase(),
          anime,
        });
        const savedVote = await vote.save();
        await this.animeModel.findByIdAndUpdate(anime._id, {
          $push: { votes: savedVote },
        });
        votes.push(savedVote);
      }

      return votes;
    } catch (e) {
      throw new Error(e);
    }
  }

  async clearAllAnimesAndVotes(): Promise<void> {
    try {
      await this.voteModel.deleteMany({});
      await this.animeModel.deleteMany({});
    } catch (e) {
      throw new Error(e);
    }
  }
}
