import { randomBytes } from 'crypto';
import { Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { nicknames } from './datas/nicknames.data.js';
import { users as userSeeds } from './datas/users.data.js';
import { teamAnimes as teamAnimeSeeds } from './datas/team-animes.data.js';
import { tracks as trackSeeds } from './datas/tracks.data.js';
import { MemberData } from '../members/data/member.data.js';
import { MembersService } from '../members/members.service.js';
import { UsersService } from '../users/users.service.js';
import { ROLE } from '../users/enums/index.js';
import { animeSeries } from './datas/anime.data.js';
import { PollsService } from '../polls/polls.service.js';
import { ProposalsService } from '../proposals/proposals.service.js';
import { proposalSeasons } from './datas/proposals.data.js';
import { CreateAnimeData, VoteData } from '../polls/data/index.js';
import { ROLES_ON_VOTE } from '../polls/enums/index.js';
import { TeamAnimesService } from '../team-animes/team-animes.service.js';
import { TrackService } from '../tracks/tracks.service.js';
import type { AppConfig } from '../config/configuration.js';

const ROOT_USERNAME = 'root';

@Injectable()
export class SeedCommand {
  constructor(
    private readonly usersService: UsersService,
    private readonly membersService: MembersService,
    private readonly pollsService: PollsService,
    private readonly proposalsService: ProposalsService,
    private readonly teamAnimesService: TeamAnimesService,
    private readonly trackService: TrackService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  private resolvePassword(fromEnv?: string) {
    return fromEnv
      ? { password: fromEnv, isGenerated: false }
      : { password: randomBytes(12).toString('hex'), isGenerated: true };
  }

  async root() {
    if (await this.usersService.findOneByUsername(ROOT_USERNAME)) {
      console.log('seed:root - already exists, skipped');
      return;
    }

    const { password, isGenerated } = this.resolvePassword(
      this.config.get('seed.rootPassword', { infer: true }),
    );

    await this.usersService.create({
      username: ROOT_USERNAME,
      password,
      email: this.config.get('seed.rootEmail', { infer: true }),
      role: ROLE.ADMIN,
    });

    console.log(`seed:root - created user "${ROOT_USERNAME}"`);
    if (isGenerated) console.log(`seed:root - generated password: ${password}`);
  }

  async users() {
    const { password, isGenerated } = this.resolvePassword(
      this.config.get('seed.userPassword', { infer: true }),
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

  async anime() {
    const { ongoings, olds } = await this.pollsService.findAll();
    const existing = new Set([...ongoings, ...olds].map(({ name }) => name));
    let created = 0;

    for (const anime of animeSeries) {
      if (existing.has(anime.name)) continue;

      const animeTemplate: CreateAnimeData = {
        isPriority: false,
        isDecided: false,
        isSponsored: false,
        ...anime,
      };
      await this.pollsService.createAnime(animeTemplate);
      created++;
    }

    console.log(
      `seed:anime - created ${created}, skipped ${
        animeSeries.length - created
      }`,
    );
  }

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

  async proposals() {
    const { seasons: existing } = await this.proposalsService.findAll();
    let created = 0;

    for (const { season, year, proposals } of proposalSeasons) {
      let current = existing.find(
        (s) => s.season === season && s.year === year,
      );

      if (!current) {
        const { _id } = await this.proposalsService.createSeason({
          season,
          year,
        });
        current = { _id, season, year, isClosed: false, proposals: [] };
      }

      // A closed season takes no new titles, it stays as an admin left it.
      if (current.isClosed) continue;

      const known = new Set(current.proposals.map(({ ukrName }) => ukrName));

      for (const { participants, ...proposal } of proposals) {
        if (known.has(proposal.ukrName)) continue;

        const { _id } = await this.proposalsService.createProposal({
          ...proposal,
          seasonId: String(current._id),
        });

        for (const { userName, roles } of participants) {
          await this.proposalsService.setParticipation(
            userName,
            String(_id),
            roles,
          );
        }
        created++;
      }
    }

    console.log(`seed:proposals - created ${created} proposals`);
  }

  async votes() {
    const { ongoings } = await this.pollsService.findAll();

    if (!ongoings.length) {
      throw new Error(
        'seed:votes - no ongoing anime found, run seed:anime first',
      );
    }

    const roles = Object.values(ROLES_ON_VOTE);

    for (const [userIndex, user] of userSeeds.entries()) {
      const voteData: VoteData = {
        votes: ongoings.slice(0, 3 + userIndex).map((anime, animeIndex) => ({
          animeId: String((anime as unknown as { _id: Types.ObjectId })._id),
          roles: [
            roles[(userIndex + animeIndex) % roles.length],
            roles[(userIndex + animeIndex + 1) % roles.length],
          ],
        })),
      };

      await this.pollsService.vote(user.username, voteData);
    }

    console.log(`seed:votes - voted for ${userSeeds.length} demo users`);
  }

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

  async all() {
    await this.root();
    await this.users();
    await this.nicknames();
    await this.anime();
    await this.teamAnimes();
    await this.votes();
    await this.proposals();
    await this.tracks();
  }

  async clear() {
    console.log('to do');
  }
}
