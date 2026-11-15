import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { isValidObjectId, Model, Types } from 'mongoose';
import { ProposalsService } from '../proposals/proposals.service.js';
import {
  ANIME_TYPE,
  type MEMBER_ROLE,
  splitOptionals,
} from '../shared/index.js';
import type {
  CreateProjectData,
  FinishProjectData,
  UpdateProjectData,
} from './data/index.js';
import type {
  Project,
  ProjectTitle,
  SeasonLayout,
} from './interfaces/index.js';
import { MAX_PARTICIPANTS } from './enums/index.js';
import { buildLayout, seasonOfDay, todayInKyiv } from './layout.js';

type ProjectFields = Omit<
  CreateProjectData,
  'proposalId' | 'endDate' | 'isInTime'
>;

interface Participant {
  nickname: string;
  roles: MEMBER_ROLE[];
}

const END_DATE_REQUIRED = 'Вкажіть дату завершення';
// Two tracks of one project written at once can both try to add the same new person
const ADD_ATTEMPTS = 3;

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @Inject('PROJECT_MODEL') private readonly projectModel: Model<Project>,
    private readonly proposalsService: ProposalsService,
  ) {}

  async findAll(): Promise<{ seasons: SeasonLayout[] }> {
    return { seasons: buildLayout(await this.list(), todayInKyiv()) };
  }

  // Every project once, as stored, with no layout by season
  list(): Promise<Project[]> {
    return this.projectModel.find().lean<Project[]>();
  }

  // Every project, the unfinished first and the newest first
  async titles(): Promise<ProjectTitle[]> {
    const projects = await this.list();

    return projects
      .sort(
        (a, b) =>
          Number(a.isFinished) - Number(b.isFinished) ||
          b.startDate.localeCompare(a.startDate) ||
          a.ukrName.localeCompare(b.ukrName, 'uk'),
      )
      .map(
        ({
          _id,
          ukrName,
          romajiName,
          codeName,
          titleType,
          isOngoing,
          isFinished,
          startDate,
        }) => ({
          _id: String(_id),
          ukrName,
          romajiName,
          ...(codeName && { codeName }),
          titleType,
          isOngoing,
          isFinished,
          startDate,
          ...seasonOfDay(startDate),
        }),
      );
  }

  findOne(id: string): Promise<Project> {
    return this.findProject(id);
  }

  // Puts who worked on a title into the team of its project. It only adds:
  // nobody is taken off when a track is deleted. The team has to stay what the
  // project form accepts, so a nickname that is there in another case only gains
  // the role, and nobody is added past MAX_PARTICIPANTS.
  async addParticipants(
    id: string,
    entries: { nickname: string; role: MEMBER_ROLE }[],
  ): Promise<void> {
    const wanted = new Map<string, Participant>();

    for (const { nickname, role } of entries) {
      const name = nickname.trim();

      if (!name) continue;

      const known = wanted.get(name.toLowerCase()) ?? {
        nickname: name,
        roles: [],
      };

      if (!known.roles.includes(role)) known.roles.push(role);
      wanted.set(name.toLowerCase(), known);
    }

    let project = await this.findProject(id);

    for (let attempt = 0; attempt < ADD_ATTEMPTS; attempt++) {
      if (await this.addMissing(project, [...wanted.values()])) return;

      project = await this.findProject(id);
    }

    throw new ConflictException(
      'Команду проєкту змінювали одночасно, учасників не додано',
    );
  }

  // Writes what the team of the project lacks. It answers false when somebody
  // else put one of the new people there first, and the caller reads it again.
  private async addMissing(
    project: Project,
    wanted: Participant[],
  ): Promise<boolean> {
    const team = new Map(
      project.participants.map((person) => [
        person.nickname.toLowerCase(),
        person,
      ]),
    );
    const gaining: Participant[] = [];
    const joining: Participant[] = [];

    for (const { nickname, roles } of wanted) {
      const person = team.get(nickname.toLowerCase());

      if (!person) {
        joining.push({ nickname, roles });
        continue;
      }

      const missing = roles.filter((role) => !person.roles.includes(role));

      if (missing.length) {
        gaining.push({ nickname: person.nickname, roles: missing });
      }
    }

    const room = Math.max(MAX_PARTICIPANTS - project.participants.length, 0);

    if (joining.length > room) {
      this.logger.warn(
        `Проєкт ${project.ukrName}: у команді немає місця для ${joining
          .slice(room)
          .map(({ nickname }) => nickname)
          .join(', ')}`,
      );
      joining.length = room;
    }

    if (gaining.length) {
      await this.projectModel.updateOne(
        { _id: project._id },
        {
          $addToSet: Object.fromEntries(
            gaining.map(({ roles }, index) => [
              `participants.$[p${index}].roles`,
              { $each: roles },
            ]),
          ),
        },
        {
          arrayFilters: gaining.map(({ nickname }, index) => ({
            [`p${index}.nickname`]: nickname,
          })),
        },
      );
    }

    if (joining.length) {
      const pushed = await this.projectModel.updateOne(
        {
          _id: project._id,
          'participants.nickname': {
            $nin: joining.map(({ nickname }) => nickname),
          },
        },
        {
          $push: {
            participants: { $each: joining, $slice: MAX_PARTICIPANTS },
          },
        },
      );

      return pushed.matchedCount > 0;
    }

    return true;
  }

  async findName(id: string): Promise<string> {
    const { ukrName } = await this.findProject(id);

    return ukrName;
  }

  async create({
    proposalId,
    endDate,
    isInTime,
    ...fields
  }: CreateProjectData) {
    this.assertStartedAlready(fields.startDate);

    if (endDate) this.assertEndDate(fields.startDate, endDate);
    else if (isInTime) throw new BadRequestException(END_DATE_REQUIRED);

    const _id = new Types.ObjectId();

    if (proposalId) await this.proposalsService.markLaunched(proposalId, _id);

    try {
      return await this.projectModel.create({
        _id,
        ...this.toDocument(fields).set,
        ...(endDate && { isFinished: true, endDate, isInTime: !!isInTime }),
      });
    } catch (error) {
      if (proposalId) await this.proposalsService.clearLaunched(_id);

      throw error;
    }
  }

  async update(id: string, dto: UpdateProjectData) {
    const project = await this.findProject(id);
    const { endDate, isInTime, ...fields } = dto;

    this.assertStartedAlready(fields.startDate);

    if (project.isFinished) {
      if (!endDate) throw new BadRequestException(END_DATE_REQUIRED);

      this.assertEndDate(fields.startDate, endDate);
    } else if (endDate || isInTime) {
      throw new BadRequestException(
        'Дату завершення можна вказати лише для завершеного проєкту',
      );
    }

    const { set, unset } = this.toDocument(fields);

    return this.projectModel
      .findByIdAndUpdate(
        project._id,
        {
          $set: {
            ...set,
            ...(project.isFinished && { endDate, isInTime: !!isInTime }),
          },
          ...(Object.keys(unset).length && { $unset: unset }),
        },
        { new: true },
      )
      .lean<Project>();
  }

  async finish(id: string, { endDate, isInTime }: FinishProjectData) {
    const project = await this.findProject(id);

    if (project.isFinished) throw new ConflictException('Проєкт уже завершено');

    this.assertEndDate(project.startDate, endDate);

    await this.projectModel.updateOne(
      { _id: project._id },
      { $set: { isFinished: true, endDate, isInTime } },
    );

    return this.findProject(id);
  }

  async reopen(id: string) {
    const project = await this.findProject(id);

    if (!project.isFinished) throw new ConflictException('Проєкт не завершено');

    await this.projectModel.updateOne(
      { _id: project._id },
      {
        $set: { isFinished: false, isInTime: false },
        $unset: { endDate: '' },
      },
    );

    return this.findProject(id);
  }

  async remove(id: string): Promise<boolean> {
    const project = await this.findProject(id);

    await this.projectModel.deleteOne({ _id: project._id });
    await this.proposalsService.clearLaunched(project._id);

    return true;
  }

  private toDocument(fields: ProjectFields) {
    const { codeName, posterUrl, funding, participants, ...required } = fields;
    const { set, unset } = splitOptionals({ codeName, posterUrl, funding });

    return {
      set: {
        ...required,
        ...set,
        episodesReleased:
          required.titleType === ANIME_TYPE.SERIES
            ? required.episodesReleased
            : 0,
        participants: participants.map(({ nickname, roles }) => ({
          nickname: nickname.trim(),
          roles: [...new Set(roles)],
        })),
      },
      unset,
    };
  }

  private assertStartedAlready(startDate: string) {
    if (startDate > todayInKyiv()) {
      throw new BadRequestException('Дата початку не може бути в майбутньому');
    }
  }

  private assertEndDate(startDate: string, endDate: string) {
    if (endDate < startDate) {
      throw new BadRequestException('Дата завершення раніша за дату початку');
    }

    if (endDate > todayInKyiv()) {
      throw new BadRequestException(
        'Дата завершення не може бути в майбутньому',
      );
    }
  }

  // A track in the system means the episode is out, so the count of released
  // episodes only ever grows to the newest episode with a track
  async markEpisodeReleased(id: string, episode: number): Promise<void> {
    await this.projectModel.updateOne(
      {
        _id: id,
        titleType: ANIME_TYPE.SERIES,
        episodesReleased: { $lt: episode },
      },
      { $set: { episodesReleased: episode } },
    );
  }

  private async findProject(id: string): Promise<Project> {
    if (!isValidObjectId(id)) throw new BadRequestException('Невірний id');

    const project = await this.projectModel.findById(id).lean<Project>();

    if (!project) throw new NotFoundException('Проєкт не знайдено');

    return project;
  }
}
