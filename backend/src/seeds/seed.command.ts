import { randomBytes } from 'crypto';
import { Types } from 'mongoose';
import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { nicknames } from './datas/nicknames.data';
import { users as userSeeds } from './datas/users.data';
import { teamAnimes as teamAnimeSeeds } from './datas/team-animes.data';
import { tracks as trackSeeds } from './datas/tracks.data';
import { MemberData } from '@members/data/member.data';
import { MembersService } from '@members/members.service';
import { UsersService } from '@users/users.service';
import { ROLE } from '@users/enums';
import { animeSeries } from './datas/anime.data';
import { PollsService } from 'src/polls/polls.service';
import { CreateAnimeData, VoteData } from 'src/polls/data';
import { ROLES_ON_VOTE } from 'src/polls/enums';
import { TeamAnimesService } from 'src/team-animes/team-animes.service';
import { TrackService } from 'src/tracks/tracks.service';

const ROOT_USERNAME = 'root';

@Injectable()
export class SeedCommand {
  constructor(
    private readonly usersService: UsersService,
    private readonly membersService: MembersService,
    private readonly pollsService: PollsService,
    private readonly teamAnimesService: TeamAnimesService,
    private readonly trackService: TrackService,
  ) {}

  private resolvePassword(fromEnv?: string) {
    return fromEnv
      ? { password: fromEnv, isGenerated: false }
      : { password: randomBytes(12).toString('hex'), isGenerated: true };
  }

  @Command({
    command: 'seed:root',
    describe: 'create root admin user (ROOT_PASSWORD, ROOT_EMAIL from env)',
  })
  async root() {
    if (await this.usersService.findOneByUsername(ROOT_USERNAME)) {
      console.log('seed:root - already exists, skipped');
      return;
    }

    const { password, isGenerated } = this.resolvePassword(
      process.env.ROOT_PASSWORD,
    );

    await this.usersService.create({
      username: ROOT_USERNAME,
      password,
      email: process.env.ROOT_EMAIL || 'root@inari.local',
      role: ROLE.ADMIN,
    });

    console.log(`seed:root - created user "${ROOT_USERNAME}"`);
    if (isGenerated) console.log(`seed:root - generated password: ${password}`);
  }

  @Command({
    command: 'seed:users',
    describe: 'create demo users (SEED_USER_PASSWORD from env)',
  })
  async users() {
    const { password, isGenerated } = this.resolvePassword(
      process.env.SEED_USER_PASSWORD,
    );
    let created = 0;

    for (const user of userSeeds) {
      if (await this.usersService.findOneByUsername(user.username)) continue;

      await this.usersService.create({ ...user, password });
      created++;
    }

    console.log(
      `seed:users - created ${created}, skipped ${userSeeds.length - created}`,
    );
    if (created && isGenerated) {
      console.log(
        `seed:users - generated password for all new users: ${password}`,
      );
    }
  }

  @Command({
    command: 'seed:anime',
    describe: 'create anime',
  })
  async anime() {
    const { ongoings, olds } = await this.pollsService.findAll();
    const existing = new Set([...ongoings, ...olds].map(({ name }) => name));
    let created = 0;

    for (const anime of animeSeries) {
      if (existing.has(anime.name)) continue;

      const animeTemplate = Object.assign(
        new CreateAnimeData(),
        { isPriority: false, isDecided: false, isSponsored: false },
        anime,
      );
      await this.pollsService.createAnime(animeTemplate);
      created++;
    }

    console.log(
      `seed:anime - created ${created}, skipped ${
        animeSeries.length - created
      }`,
    );
  }

  @Command({
    command: 'seed:nicknames',
    describe: 'create nicknames',
  })
  async nicknames() {
    const existing = new Set(
      (await this.membersService.findAll({})).map(({ nickname }) => nickname),
    );
    let created = 0;

    for (const nickname of nicknames) {
      if (existing.has(nickname.nickname)) continue;

      const nicknameTemplate = Object.assign(new MemberData(), nickname);
      await this.membersService.createMember(nicknameTemplate);
      created++;
    }

    console.log(
      `seed:nicknames - created ${created}, skipped ${
        nicknames.length - created
      }`,
    );
  }

  @Command({
    command: 'seed:team-animes',
    describe: 'create team animes',
  })
  async teamAnimes() {
    const existing = new Set(
      (await this.teamAnimesService.findAll()).map(({ name }) => name),
    );
    let created = 0;

    for (const anime of teamAnimeSeeds) {
      if (existing.has(anime.name)) continue;

      await this.teamAnimesService.create(anime);
      created++;
    }

    console.log(
      `seed:team-animes - created ${created}, skipped ${
        teamAnimeSeeds.length - created
      }`,
    );
  }

  @Command({
    command: 'seed:votes',
    describe: 'create demo votes for ongoing anime (needs seed:anime)',
  })
  async votes() {
    const { ongoings } = await this.pollsService.findAll();

    if (!ongoings.length) {
      throw new Error(
        'seed:votes - no ongoing anime found, run seed:anime first',
      );
    }

    const roles = Object.values(ROLES_ON_VOTE);

    for (const [userIndex, user] of userSeeds.entries()) {
      const voteData = Object.assign(new VoteData(), {
        votes: ongoings.slice(0, 3 + userIndex).map((anime, animeIndex) => ({
          animeId: String((anime as unknown as { _id: Types.ObjectId })._id),
          roles: [
            roles[(userIndex + animeIndex) % roles.length],
            roles[(userIndex + animeIndex + 1) % roles.length],
          ],
        })),
      });

      await this.pollsService.vote(user.username, voteData);
    }

    console.log(`seed:votes - voted for ${userSeeds.length} demo users`);
  }

  @Command({
    command: 'seed:tracks',
    describe: 'create demo tracks (needs seed:root and seed:nicknames)',
  })
  async tracks() {
    if (!(await this.usersService.findOneByUsername(ROOT_USERNAME))) {
      throw new Error('seed:tracks - root user not found, run seed:root first');
    }

    const existingMembers = new Set(
      (await this.membersService.findAll({})).map(({ nickname }) => nickname),
    );
    const missingMembers = [
      ...new Set(
        trackSeeds.flatMap(({ membersInfo }) =>
          membersInfo.map(({ nickname }) => nickname),
        ),
      ),
    ].filter((nickname) => !existingMembers.has(nickname));

    if (missingMembers.length) {
      throw new Error(
        `seed:tracks - members not found (${missingMembers.join(
          ', ',
        )}), run seed:nicknames first`,
      );
    }

    let created = 0;

    for (const track of trackSeeds) {
      const existing = await this.trackService.getLastTracks({
        titleName: track.nameTitle,
        episode: track.currentEpisode + 1,
      });
      if (existing.length) continue;

      await this.trackService.create(JSON.parse(JSON.stringify(track)));
      created++;
    }

    console.log(
      `seed:tracks - created ${created}, skipped ${
        trackSeeds.length - created
      }`,
    );
  }

  @Command({
    command: 'seed:all',
    describe: 'run every seed in dependency order',
  })
  async all() {
    await this.root();
    await this.users();
    await this.nicknames();
    await this.anime();
    await this.teamAnimes();
    await this.votes();
    await this.tracks();
  }

  @Command({
    command: 'seed:clear',
    describe: 'clear lists',
  })
  async clear() {
    console.log('to do');
  }
}
