import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { ITeamAnime } from './interfaces/team-anime.interface';
import { CreateAnimeData } from './data/create-team-anime.data';

@Injectable()
export class TeamAnimesService {
  constructor(
    @Inject('TEAM_ANIME_MODEL')
    private readonly teamAnimeModel: Model<ITeamAnime>,
  ) {}

  async getAllTeamAnime(): Promise<ITeamAnime[]> {
    return this.teamAnimeModel.find().exec();
  }

  async createTeamAnime(anime: CreateAnimeData): Promise<ITeamAnime> {
    return this.teamAnimeModel.create({ name: anime.name });
  }

  async deleteTeamAnime(id: string): Promise<boolean> {
    this.teamAnimeModel.deleteOne({ _id: id });
    return true;
  }
}
