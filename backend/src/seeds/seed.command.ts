import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { nicknames } from './datas/nicknames.data';
import { UserData } from 'src/users/data/nickname.data';
import { UserService } from 'src/users/users.service';
import { animeSeries } from './datas/anime.data';
import { PollsService } from 'src/polls/polls.service';
import { AnimeData } from 'src/polls/data/anime.data';

@Injectable()
export class SeedCommand {
  constructor(
    private readonly usersService: UserService,
    private readonly pollsService: PollsService,
  ) {}

  @Command({
    command: 'seed:anime',
    describe: 'create anime',
  })
  async anime() {
    for (const anime of animeSeries) {
      const animeTemplate = Object.assign(new AnimeData(), anime);
      await this.pollsService.createAnime(animeTemplate);
    }
  }

  @Command({
    command: 'seed:nicknames',
    describe: 'create nicknames',
  })
  async nicknames() {
    for (const nickname of nicknames) {
      const nicknameTemplate = Object.assign(new UserData(), nickname);
      await this.usersService.createUser(nicknameTemplate);
    }
  }

  @Command({
    command: 'seed:clear',
    describe: 'clear lists',
  })
  async clear() {
    console.log('to do');
  }
}
