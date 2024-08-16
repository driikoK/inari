import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import AppDataSource from '../../db/config/migration';
import { Anime } from 'src/polls/entities/anime.entity';
import { anime } from './datas/anime.data';
import { nicknames } from './datas/nicknames.data';
import { UserData } from 'src/users/data/nickname.data';
import { UserService } from 'src/users/users.service';

@Injectable()
export class SeedCommand {
  constructor(
    private readonly usersService: UserService,
  ) {}

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
    await AppDataSource.initialize();

    await AppDataSource.query(`TRUNCATE TABLE "user" CASCADE`);

    await AppDataSource.destroy();
  }
}
