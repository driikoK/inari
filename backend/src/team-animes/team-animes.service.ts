import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { ITeamAnime } from './interfaces/team-anime.interface.js';

// The old list of titles. Nothing writes to it any more, it is read only by
// migrate:titles, which moves its titles to the projects.
@Injectable()
export class TeamAnimesService {
  constructor(
    @Inject('TEAM_ANIME_MODEL')
    private readonly teamAnimeModel: Model<ITeamAnime>,
  ) {}

  async findAll(): Promise<ITeamAnime[]> {
    return await this.teamAnimeModel.find().sort({ name: 1 });
  }

  // Says where the titles with these names went, so that a later run leaves them alone
  async markMoved(names: string[], projectId: string): Promise<void> {
    await this.teamAnimeModel.updateMany(
      { name: { $in: names } },
      { $set: { projectId } },
    );
  }
}
