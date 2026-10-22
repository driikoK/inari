import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isValidObjectId, Model, Types } from 'mongoose';
import { ProposalsService } from '../proposals/proposals.service.js';
import { ANIME_TYPE, splitOptionals } from '../shared/index.js';
import type {
  CreateProjectData,
  FinishProjectData,
  UpdateProjectData,
} from './data/index.js';
import type { Project, SeasonLayout } from './interfaces/index.js';
import { buildLayout, todayInKyiv } from './layout.js';

type ProjectFields = Omit<
  CreateProjectData,
  'proposalId' | 'endDate' | 'isInTime'
>;

const END_DATE_REQUIRED = 'Вкажіть дату завершення';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject('PROJECT_MODEL') private readonly projectModel: Model<Project>,
    private readonly proposalsService: ProposalsService,
  ) {}

  async findAll(): Promise<{ seasons: SeasonLayout[] }> {
    const projects = await this.projectModel.find().lean<Project[]>();

    return { seasons: buildLayout(projects, todayInKyiv()) };
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

  private async findProject(id: string): Promise<Project> {
    if (!isValidObjectId(id)) throw new BadRequestException('Невірний id');

    const project = await this.projectModel.findById(id).lean<Project>();

    if (!project) throw new NotFoundException('Проєкт не знайдено');

    return project;
  }
}
