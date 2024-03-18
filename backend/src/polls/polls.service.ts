import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Anime } from './entities/anime.entity';
import { Vote } from './entities/vote.entity';

@Injectable()
export class PollsService {
  constructor(
    @InjectRepository(Anime)
    private animeRepository: Repository<Anime>,
    @InjectRepository(Vote)
    private voteRepository: Repository<Vote>,
  ) {}

  async createAnime(animeTemplate: Anime) {
    try {
      const anime = this.animeRepository.create(animeTemplate);
      return await this.animeRepository.save(anime);
    } catch (e) {
      throw new Error(e);
    }
  }

  async findAnimeByIsOngoing(isOngoing: boolean): Promise<Anime[]> {
    try {
      return await this.animeRepository.find({
        where: { isOngoing },
      });
    } catch (e) {
      throw new Error(e);
    }
  }

  async getVoteResult(): Promise<{ anime: Anime; voteCount: number }[]> {
    try {
      const animeWithVotes = await this.animeRepository.find({
        relations: ['votes'],
      });

      animeWithVotes.sort((a, b) => b.getTotalVotes() - a.getTotalVotes());

      return animeWithVotes.map((anime) => ({
        anime,
        voteCount: anime.getTotalVotes(),
      }));
    } catch (e) {
      throw new Error(e);
    }
  }

  async vote(userName: string, animeIds: number[]): Promise<Vote[]> {
    try {
      if (!animeIds.length) {
        throw new Error('animeIds is empty');
      }

      if (animeIds.length > 5) {
        throw new Error('The user selected more 5 anime');
      }

      const validUserName = await this.voteRepository.findOne({
        where: { userName: ILike(userName) },
      });

      if (validUserName) {
        throw new Error('The user has already voted');
      }

      const votes: Vote[] = [];

      for (const animeId of animeIds) {
        const anime = await this.animeRepository.findOne({
          where: { id: animeId },
        });

        if (!anime) {
          throw new Error('Anime not found');
        }

        const existingVote = await this.voteRepository.findOne({
          where: { userName, anime: { id: animeId } },
        });

        if (existingVote) {
          continue;
        }

        const vote = this.voteRepository.create({ userName, anime });
        const savedVote = await this.voteRepository.save(vote);
        votes.push(savedVote);
      }

      return votes;
    } catch (e) {
      throw new Error(e);
    }
  }
}
