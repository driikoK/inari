import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isValidObjectId, Model, Types } from 'mongoose';
import { type MEMBER_ROLE, SEASON, splitOptionals } from '../shared/index.js';
import type {
  CreateProposalData,
  CreateSeasonData,
  UpdateProposalData,
} from './data/index.js';
import { MAX_PROPOSALS_PER_PERSON } from './enums/index.js';
import type {
  Proposal,
  ProposalSeason,
  SeasonWithProposals,
} from './interfaces/index.js';

const SEASON_ORDER: string[] = Object.values(SEASON);

const SEASON_CLOSED = 'Сезон закрито';
const TITLE_EXISTS = 'Така пропозиція вже є в цьому сезоні';
const ALREADY_LAUNCHED = 'Цю пропозицію вже запущено як проєкт';
const LIMIT_REACHED = `Можна долучитися максимум до ${MAX_PROPOSALS_PER_PERSON} проєктів у сезоні`;

@Injectable()
export class ProposalsService {
  private readonly queues = new Map<string, Promise<void>>();

  constructor(
    @Inject('PROPOSAL_SEASON_MODEL')
    private readonly seasonModel: Model<ProposalSeason>,
    @Inject('PROPOSAL_MODEL')
    private readonly proposalModel: Model<Proposal>,
  ) {}

  async findAll(): Promise<{
    maxPerPerson: number;
    seasons: SeasonWithProposals[];
  }> {
    const [seasons, proposals] = await Promise.all([
      this.seasonModel.find().lean<ProposalSeason[]>(),
      this.proposalModel.find().sort({ _id: 1 }).lean<Proposal[]>(),
    ]);

    const bySeason = new Map<string, Proposal[]>();
    for (const proposal of proposals) {
      const key = String(proposal.seasonId);
      const group = bySeason.get(key);

      if (group) group.push(proposal);
      else bySeason.set(key, [proposal]);
    }

    return {
      maxPerPerson: MAX_PROPOSALS_PER_PERSON,
      seasons: [...seasons]
        .sort(
          (a, b) =>
            a.year - b.year ||
            SEASON_ORDER.indexOf(a.season) - SEASON_ORDER.indexOf(b.season),
        )
        .map((season) => ({
          ...season,
          proposals: bySeason.get(String(season._id)) ?? [],
        })),
    };
  }

  async createSeason({ season, year }: CreateSeasonData) {
    if (await this.seasonModel.exists({ season, year })) {
      throw new ConflictException('Такий сезон вже існує');
    }

    return this.seasonModel.create({ season, year });
  }

  async setSeasonClosed(id: string, isClosed: boolean) {
    const season = await this.seasonModel.findByIdAndUpdate(
      this.assertId(id),
      { isClosed },
      { new: true },
    );

    if (!season) throw new NotFoundException('Сезон не знайдено');

    return season;
  }

  async deleteSeason(id: string): Promise<boolean> {
    const season = await this.findSeason(id);

    if (!season.isClosed) {
      throw new ConflictException('Спочатку закрийте сезон');
    }

    await this.proposalModel.deleteMany({ seasonId: season._id });
    await this.seasonModel.deleteOne({ _id: season._id });

    return true;
  }

  async createProposal(dto: CreateProposalData) {
    const season = await this.findSeason(dto.seasonId);

    if (season.isClosed) throw new ConflictException(SEASON_CLOSED);

    await this.assertTitleFree(season._id, dto.ukrName);

    const { posterUrl, note, funding, seasonId: _seasonId, ...required } = dto;
    const { set } = splitOptionals({ posterUrl, note, funding });

    return this.proposalModel.create({
      ...required,
      seasonId: season._id,
      ...set,
    });
  }

  async updateProposal(id: string, dto: UpdateProposalData) {
    const proposal = await this.findProposal(id);
    let seasonId = proposal.seasonId;

    if (dto.seasonId && dto.seasonId !== String(seasonId)) {
      const target = await this.findSeason(dto.seasonId);

      if (target.isClosed) throw new ConflictException(SEASON_CLOSED);

      seasonId = target._id;
    }

    await this.assertTitleFree(seasonId, dto.ukrName, proposal._id);

    const { posterUrl, note, funding, seasonId: _target, ...required } = dto;
    const { set, unset } = splitOptionals({ posterUrl, note, funding });

    return this.proposalModel
      .findByIdAndUpdate(
        proposal._id,
        {
          $set: { ...required, seasonId, ...set },
          ...(Object.keys(unset).length && { $unset: unset }),
        },
        { new: true },
      )
      .lean();
  }

  async deleteProposal(id: string): Promise<boolean> {
    const proposal = await this.findProposal(id);

    await this.proposalModel.deleteOne({ _id: proposal._id });

    return true;
  }

  setParticipation(userName: string, proposalId: string, roles: MEMBER_ROLE[]) {
    return this.serialize(userName, async () => {
      const proposal = await this.findProposal(proposalId);
      const season = await this.findSeason(String(proposal.seasonId));

      if (season.isClosed) throw new ConflictException(SEASON_CLOSED);

      const uniqueRoles = [...new Set(roles)];
      const hasJoined = proposal.participants.some(
        (participant) => participant.userName === userName,
      );

      if (hasJoined || !uniqueRoles.length) {
        await this.changeRoles(proposal._id, userName, uniqueRoles);
      } else {
        await this.join(proposal, userName, uniqueRoles);
      }

      return this.findProposal(proposalId);
    });
  }

  async setParticipantRoles(
    proposalId: string,
    userName: string,
    roles: MEMBER_ROLE[],
  ) {
    const proposal = await this.findProposal(proposalId);

    if (!proposal.participants.some((p) => p.userName === userName)) {
      throw new NotFoundException('Учасника не знайдено');
    }

    await this.changeRoles(proposal._id, userName, [...new Set(roles)]);

    return this.findProposal(proposalId);
  }

  async markLaunched(id: string, projectId: Types.ObjectId): Promise<void> {
    const proposal = await this.findProposal(id);
    const { modifiedCount } = await this.proposalModel.updateOne(
      { _id: proposal._id, projectId: { $exists: false } },
      { $set: { projectId } },
    );

    if (!modifiedCount) throw new ConflictException(ALREADY_LAUNCHED);
  }

  clearLaunched(projectId: Types.ObjectId) {
    return this.proposalModel.updateMany(
      { projectId },
      { $unset: { projectId: '' } },
    );
  }

  async deleteParticipationsByUser(userName: string): Promise<void> {
    const openSeasons = await this.seasonModel
      .find({ isClosed: false }, { _id: 1 })
      .lean<Pick<ProposalSeason, '_id'>[]>();

    await this.proposalModel.updateMany(
      {
        seasonId: { $in: openSeasons.map((season) => season._id) },
        'participants.userName': userName,
      },
      { $pull: { participants: { userName } } },
    );
  }

  // One person's joins run one after another, so counting and pushing is not
  // interleaved with their other joins. It covers this process only, the
  // recount in join() is what holds the cap if the API is ever run twice.
  private serialize<T>(key: string, task: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(key) ?? Promise.resolve();
    const run = previous.then(task, task);
    const tail = run.then(
      () => undefined,
      () => undefined,
    );

    this.queues.set(key, tail);
    void tail.then(() => {
      if (this.queues.get(key) === tail) this.queues.delete(key);
    });

    return run;
  }

  private async join(
    proposal: Proposal,
    userName: string,
    roles: MEMBER_ROLE[],
  ) {
    const joinedBefore = await this.countJoined(proposal.seasonId, userName);

    if (joinedBefore >= MAX_PROPOSALS_PER_PERSON) {
      throw new ConflictException(LIMIT_REACHED);
    }

    await this.proposalModel.updateOne(
      { _id: proposal._id, 'participants.userName': { $ne: userName } },
      { $push: { participants: { userName, roles } } },
    );

    const joinedAfter = await this.countJoined(proposal.seasonId, userName);

    if (joinedAfter > MAX_PROPOSALS_PER_PERSON) {
      await this.pullParticipant(proposal._id, userName);

      throw new ConflictException(LIMIT_REACHED);
    }
  }

  private async changeRoles(
    proposalId: Types.ObjectId,
    userName: string,
    roles: MEMBER_ROLE[],
  ) {
    if (!roles.length) {
      await this.pullParticipant(proposalId, userName);

      return;
    }

    await this.proposalModel.updateOne(
      { _id: proposalId, 'participants.userName': userName },
      { $set: { 'participants.$.roles': roles } },
    );
  }

  private pullParticipant(proposalId: Types.ObjectId, userName: string) {
    return this.proposalModel.updateOne(
      { _id: proposalId },
      { $pull: { participants: { userName } } },
    );
  }

  private countJoined(seasonId: Types.ObjectId, userName: string) {
    return this.proposalModel.countDocuments({
      seasonId,
      'participants.userName': userName,
    });
  }

  private async assertTitleFree(
    seasonId: Types.ObjectId,
    ukrName: string,
    exceptId?: Types.ObjectId,
  ) {
    const duplicate = await this.proposalModel.exists({
      seasonId,
      ukrName,
      ...(exceptId && { _id: { $ne: exceptId } }),
    });

    if (duplicate) throw new ConflictException(TITLE_EXISTS);
  }

  private assertId(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Невірний id');

    return id;
  }

  private async findSeason(id: string): Promise<ProposalSeason> {
    const season = await this.seasonModel
      .findById(this.assertId(id))
      .lean<ProposalSeason>();

    if (!season) throw new NotFoundException('Сезон не знайдено');

    return season;
  }

  private async findProposal(id: string): Promise<Proposal> {
    const proposal = await this.proposalModel
      .findById(this.assertId(id))
      .lean<Proposal>();

    if (!proposal) throw new NotFoundException('Пропозицію не знайдено');

    return proposal;
  }
}
