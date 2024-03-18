import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import AppDataSource from '../../db/config/migration';
import { Anime } from 'src/polls/entities/anime.entity';
import { anime } from './datas/anime.data';
import { PollsService } from 'src/polls/polls.service';

@Injectable()
export class SeedCommand {
  constructor(private readonly pollsService: PollsService) {}

  @Command({
    command: 'seed:anime',
    describe: 'create anime',
  })
  async anime() {
    for (const oneAnime of anime) {
      const animeTemplate = Object.assign(new Anime(), oneAnime);
      await this.pollsService.createAnime(animeTemplate);
    }
  }

  @Command({
    command: 'seed:clear',
    describe: 'clear lists',
  })
  async clear() {
    await AppDataSource.initialize();

    await AppDataSource.query(`TRUNCATE TABLE "user" CASCADE`);

    await AppDataSource.destroy();
  }

  @Command({
    command: 'seed:init',
    describe: 'create a lists',
  })
  async init() {
    await this.anime();
  }
}
