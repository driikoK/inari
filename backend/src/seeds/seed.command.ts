import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';
import { Types, type Mongoose } from 'mongoose';
import { nicknames } from './datas/nicknames.data.js';
import { users as userSeeds } from './datas/users.data.js';
import { tracks as trackSeeds } from './datas/tracks.data.js';
import { describeTitlePlan, planTitles } from './titles-plan.js';
import { MemberData } from '../members/data/member.data.js';
import { MembersService } from '../members/members.service.js';
import { UsersService } from '../users/users.service.js';
import { ROLE } from '../users/enums/index.js';
import { ProposalsService } from '../proposals/proposals.service.js';
import { proposalSeasons } from './datas/proposals.data.js';
import { projectSeeds } from './datas/projects.data.js';
import {
  budgetSeeds,
  expenseSeeds,
  supportSeeds,
} from './datas/budget.data.js';
import { BudgetService } from '../budget/budget.service.js';
import { SYSTEM_ACTOR } from '../budget/enums/index.js';
import { ProjectsService } from '../projects/projects.service.js';
import { todayInKyiv } from '../projects/layout.js';
import { TeamAnimesService } from '../team-animes/team-animes.service.js';
import { TrackService } from '../tracks/tracks.service.js';
import type { AppConfig } from '../config/configuration.js';

const ROOT_USERNAME = 'root';
const POLL_COLLECTIONS = ['votes', 'poll_animes'];

@Injectable()
export class SeedCommand {
  constructor(
    @Inject('DATABASE_CONNECTION') private readonly database: Mongoose,
    private readonly budgetService: BudgetService,
    private readonly usersService: UsersService,
    private readonly membersService: MembersService,
    private readonly proposalsService: ProposalsService,
    private readonly projectsService: ProjectsService,
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

  async nicknames() {
    const existing = new Set(
      (await this.membersService.findAll({})).map(({ nickname }) => nickname),
    );
    let created = 0;

    for (const nickname of nicknames) {
      if (existing.has(nickname.nickname)) continue;

      const nicknameTemplate = Object.assign(new MemberData(), nickname);
      await this.membersService.createMember(nicknameTemplate, SYSTEM_ACTOR);
      created++;
    }

    console.log(
      `seed:nicknames - created ${created}, skipped ${
        nicknames.length - created
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

  async projects() {
    const { seasons } = await this.projectsService.findAll();
    const known = new Set(
      seasons.flatMap(({ projects }) => projects.map(({ ukrName }) => ukrName)),
    );
    let created = 0;

    for (const { finish, ...seed } of projectSeeds(todayInKyiv())) {
      if (known.has(seed.ukrName)) continue;

      await this.projectsService.create({ ...seed, ...finish });
      created++;
    }

    console.log(`seed:projects - created ${created} projects`);
  }

  async budget() {
    const { total } = await this.budgetService.findEntries({
      page: 1,
      perPage: 1,
    });

    if (total > 0) {
      console.log('seed:budget - the journal is not empty, skipped');
      return;
    }

    const today = todayInKyiv();
    const incomes = budgetSeeds(today);
    const expenses = expenseSeeds(today);

    for (const operation of incomes) {
      await this.budgetService.createIncomes(operation, SYSTEM_ACTOR);
    }

    await this.budgetService.updateSupport(supportSeeds(today), SYSTEM_ACTOR);

    for (const operation of expenses) {
      await this.budgetService.createExpenses(operation, SYSTEM_ACTOR);
    }

    console.log(
      `seed:budget - added ${incomes.length} income operations, the support budgets and ${expenses.length} payouts`,
    );
  }

  async tracks() {
    const unlinked = await this.trackService.countUnlinked();

    if (unlinked > 0) {
      throw new Error(
        `seed:tracks - ${unlinked} tracks have no project, and this seed finds its tracks by project, so it would write them all again. Run migrate:titles first`,
      );
    }

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

    const projectIds = new Map(
      (await this.projectsService.list()).map(({ _id, romajiName }) => [
        romajiName,
        String(_id),
      ]),
    );
    const missingTitles = [
      ...new Set(trackSeeds.map(({ title }) => title)),
    ].filter((title) => !projectIds.has(title));

    if (missingTitles.length) {
      throw new Error(
        `seed:tracks - projects not found (${missingTitles.join(
          ', ',
        )}), run seed:projects first`,
      );
    }

    let created = 0;

    for (const { title, ...track } of trackSeeds) {
      const projectId = projectIds.get(title);
      const existing = await this.trackService.getLastTracks({
        projectId,
        episode: track.currentEpisode + 1,
      });
      if (existing.length) continue;

      await this.trackService.create(
        JSON.parse(JSON.stringify({ ...track, projectId })),
        SYSTEM_ACTOR,
      );
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
    await this.proposals();
    await this.projects();
    await this.tracks();
    await this.budget();
  }

  // Turns the titles of the old list, and the titles the tracks were written
  // under, into projects, and links the tracks to them
  async migrateTitles(dryRun: boolean) {
    const label = dryRun ? 'migrate:titles (dry run)' : 'migrate:titles';
    const [teamAnimes, groups, projects] = await Promise.all([
      this.teamAnimesService.findAll(),
      this.trackService.titleGroups(),
      this.projectsService.list(),
    ]);
    const plans = planTitles({
      teamTitles: teamAnimes.map((anime) => ({
        name: anime.name,
        createdAt: (
          anime as typeof anime & { _id: Types.ObjectId }
        )._id.getTimestamp(),
        ...(anime.projectId && { projectId: anime.projectId }),
      })),
      groups,
      projects: projects.map(
        ({
          _id,
          ukrName,
          romajiName,
          codeName,
          titleType,
          startDate,
          episodesReleased,
        }) => ({
          _id: String(_id),
          ukrName,
          romajiName,
          codeName,
          titleType,
          startDate,
          episodesReleased,
        }),
      ),
      today: todayInKyiv(),
    });
    const count = (pick: (plan: (typeof plans)[number]) => boolean) =>
      plans.filter(pick).length;

    console.log(
      `${label} - ${plans.length} titles: ${count(({ state }) => state === 'active')} to make active projects, ${count(({ state }) => state === 'finished')} finished projects, ${count(({ action }) => action === 'link')} are projects already, ${count(({ action }) => action === 'moved')} moved by an earlier run, ${count(({ action }) => action === 'ambiguous')} to decide by hand`,
    );
    for (const plan of plans) {
      if (plan.action !== 'moved') console.log(describeTitlePlan(plan));
    }

    if (dryRun) return;

    let created = 0;
    let linked = 0;

    for (const plan of plans) {
      if (plan.action === 'ambiguous' || plan.action === 'moved') continue;

      let projectId = plan.projectId;

      if (plan.action === 'create' && plan.project) {
        const project = await this.projectsService.create(plan.project);

        projectId = String(project._id);
        created++;
      }

      if (projectId) {
        linked += await this.trackService.linkProject(plan.names, projectId);
        await this.teamAnimesService.markMoved(plan.names, projectId);
      }

      if (projectId && plan.raiseTo) {
        await this.projectsService.markEpisodeReleased(projectId, plan.raiseTo);
      }
    }

    console.log(
      `${label} - created ${created} projects, linked ${linked} tracks`,
    );
  }

  async dropPolls() {
    const db = this.database.connection.db;
    if (!db) throw new Error('drop:polls - no database connection');

    const existing = new Set(
      (await db.listCollections({}, { nameOnly: true }).toArray()).map(
        ({ name }) => name,
      ),
    );

    for (const name of POLL_COLLECTIONS) {
      if (!existing.has(name)) {
        console.log(`drop:polls - ${name} not found, skipped`);
        continue;
      }

      const count = await db.collection(name).countDocuments();
      await db.dropCollection(name);
      console.log(`drop:polls - dropped ${name} (${count} documents)`);
    }
  }

  async clear() {
    console.log('to do');
  }
}
