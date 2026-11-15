import { HydratedDocument, isValidObjectId, Model } from 'mongoose';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import { formatCrumbs, round3 } from '../budget/calc.js';
import { CrumbAuditService } from '../budget/crumb-audit.service.js';
import {
  type CrumbAuditItem,
  type CrumbsChange,
  describeTrack,
  formatSignedCrumbs,
  trackSnapshot,
} from '../budget/crumbs.js';
import { AUDIT_KIND } from '../budget/enums/index.js';
import { MembersService } from '../members/members.service.js';
import type { Project } from '../projects/interfaces/index.js';
import {
  ordinalOf,
  seasonOfDay,
  seasonOrdinal,
  todayInKyiv,
} from '../projects/layout.js';
import { ProjectsService } from '../projects/projects.service.js';
import { MEMBER_ROLE, pick, plural, type SEASON } from '../shared/index.js';
import { DictionariesService } from '../dictionaries/dictionaries.service.js';
import { UsersService } from '../users/users.service.js';
import { UpdateTrackData } from './data/update-track.data.js';
import { CreateTrackData, MemberInfo } from './data/create-track.data.js';
import { FilterTrackData } from './data/filter-track.data.js';
import {
  BulkDeleteResult,
  ITrack,
  ITracksWithPagination,
  Multipliers,
  NicknameCoins,
  SeasonCoins,
  TitleGroup,
} from './interfaces/track.interface.js';
import { MULTIPLIER } from './enums/types.enum.js';
import { LastTracksData } from './data/last-tracks.js';

// A track as it is written: the title comes from its project
type NewTrack = CreateTrackData &
  Pick<ITrack, 'nameTitle' | 'titleType' | 'season' | 'year'>;

@Injectable()
export class TrackService {
  private readonly logger = new Logger(TrackService.name);

  constructor(
    @Inject('TRACK_MODEL') private readonly trackModel: Model<ITrack>,
    private readonly membersService: MembersService,
    private readonly dictionariesService: DictionariesService,
    private readonly usersService: UsersService,
    private readonly crumbAudit: CrumbAuditService,
    private readonly projectsService: ProjectsService,
  ) {}

  async findAll(filter: FilterTrackData): Promise<ITracksWithPagination> {
    const { page = 1, perPage = 10, ...queryFilter } = filter;

    // Tracks written in one moment share their time, and a page that cuts
    // through them would repeat a track on the next page and lose another, so
    // the id decides between them
    const tracks = await this.trackModel
      .find(queryFilter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const total = await this.trackModel.countDocuments(queryFilter);

    return {
      data: tracks,
      page: Number(page),
      perPage: Number(perPage),
      total: Number(total),
    };
  }

  // Puts back what a change took, when the track write that went with it failed
  private async revert(change: CrumbsChange, actor: string) {
    try {
      await this.membersService.changeCoins(
        change.nickname,
        {
          season: change.season,
          year: change.year,
          delta: -change.delta,
          actor,
        },
        { guard: false },
      );
    } catch (error) {
      this.logger.error(
        `Не вдалося повернути крихти нікнейма ${change.nickname}`,
        error,
      );
    }
  }

  private roleLabel(role: string) {
    return (
      this.membersService.getAllRoles().find(({ value }) => value === role)
        ?.label ?? role
    );
  }

  private async findTrack(id: string): Promise<ITrack> {
    if (!isValidObjectId(id)) {
      throw new HttpException('Невірний id', HttpStatus.BAD_REQUEST);
    }

    const track = await this.trackModel.findById(id);

    if (!track)
      throw new HttpException('Трек не існує', HttpStatus.BAD_REQUEST);

    return track;
  }

  async delete(id: string, actor: string) {
    const track = await this.findTrack(id);
    const before = trackSnapshot(track);

    const change = await this.membersService.changeCoins(track.nickname, {
      season: track.season,
      year: track.year,
      delta: -track.coins,
      actor,
    });

    try {
      await this.trackModel.deleteOne({ _id: id });
    } catch (error) {
      await this.revert(change, actor);

      throw error;
    }

    await this.crumbAudit.record(
      AUDIT_KIND.TRACK_DELETED,
      actor,
      `Видалено трек ${describeTrack(before, (role) => this.roleLabel(role))}`,
      [{ change, entryId: id, before, after: null }],
    );
  }

  // Everything or nothing. The crumbs come off first, one sum for every
  // nickname and season, so when a nickname has too few of them in a season
  // nothing is removed and what was already taken is given back. A track that
  // is gone already is skipped, its crumbs went with it. The one race left is
  // the same as in deleting one track: another admin removing the same track at
  // the same moment, which is logged.
  async bulkDelete(ids: string[], actor: string): Promise<BulkDeleteResult> {
    const wanted = [...new Set(ids)];
    const found = await this.trackModel.find({ _id: { $in: wanted } });
    const byId = new Map(found.map((track) => [String(track._id), track]));
    const tracks = wanted.flatMap((id) => byId.get(id) ?? []);
    const skipped = wanted.length - tracks.length;

    if (tracks.length === 0) return { deleted: 0, skipped, coins: 0 };

    const taken = await this.takeCrumbs(tracks, actor);

    try {
      const { deletedCount } = await this.trackModel.deleteMany({
        _id: { $in: tracks.map((track) => track._id) },
      });

      if (deletedCount !== tracks.length) {
        this.logger.error(
          `Масове видалення прибрало ${deletedCount} треків із ${tracks.length}, крихти списано за всі`,
        );
      }
    } catch (error) {
      await this.giveBack(
        taken.map(({ change }) => change),
        actor,
      );

      throw error;
    }

    const coins = round3(tracks.reduce((sum, track) => sum + track.coins, 0));

    await this.crumbAudit.record(
      AUDIT_KIND.TRACK_DELETED,
      actor,
      `Видалено ${tracks.length} ${plural(tracks.length, ['трек', 'треки', 'треків'])}, ${formatCrumbs(coins)} крихт`,
      taken.flatMap(({ tracks: group, change }) =>
        this.auditRows(group, change),
      ),
    );

    return { deleted: tracks.length, skipped, coins };
  }

  // One change for every nickname and season of the tracks
  private async takeCrumbs(tracks: HydratedDocument<ITrack>[], actor: string) {
    const groups = new Map<string, HydratedDocument<ITrack>[]>();

    for (const track of tracks) {
      const key = `${track.nickname}|${track.season}|${track.year}`;

      groups.set(key, [...(groups.get(key) ?? []), track]);
    }

    const taken: {
      tracks: HydratedDocument<ITrack>[];
      change: CrumbsChange;
    }[] = [];

    try {
      for (const group of groups.values()) {
        const [{ nickname, season, year }] = group;
        const sum = round3(
          group.reduce((total, { coins }) => total + coins, 0),
        );
        const change = await this.membersService.changeCoins(nickname, {
          season,
          year,
          delta: -sum,
          actor,
        });

        taken.push({ tracks: group, change });
      }
    } catch (error) {
      await this.giveBack(
        taken.map(({ change }) => change),
        actor,
      );

      throw error;
    }

    return taken;
  }

  private async giveBack(changes: CrumbsChange[], actor: string) {
    for (const change of [...changes].reverse()) {
      await this.revert(change, actor);
    }
  }

  // A row for every track. The nickname lost the crumbs of the whole group in
  // one change, so the balance after a track is the final one plus the crumbs
  // of the tracks that come after it, and the rows of a nickname add up.
  private auditRows(
    tracks: HydratedDocument<ITrack>[],
    { nickname, season, year, coins, seasonCoins }: CrumbsChange,
  ): CrumbAuditItem[] {
    const rows: CrumbAuditItem[] = [];
    let later = 0;

    for (const track of [...tracks].reverse()) {
      rows.unshift({
        change: {
          nickname,
          season,
          year,
          delta: -track.coins,
          coins: round3(coins + later),
          seasonCoins: round3(seasonCoins + later),
        },
        entryId: String(track._id),
        before: trackSnapshot(track),
        after: null,
      });
      later += track.coins;
    }

    return rows;
  }

  private calculateAdditionalCoins = (
    multipliers: Partial<Multipliers>,
    coins: number,
  ): number => {
    let additionalCoins = 0;

    if (multipliers.isOngoing) {
      additionalCoins += coins * MULTIPLIER.ONGOING;
    }
    if (multipliers.isPriority) {
      additionalCoins += coins * MULTIPLIER.PRIORITY;
    }
    if (multipliers.isInTime) {
      additionalCoins += coins * MULTIPLIER.IN_TIME;
    }

    return additionalCoins;
  };

  private getCoinsForTrack(track: ITrack, newTrack: UpdateTrackData) {
    if (track.isGuest && newTrack.coins) {
      newTrack.coins = newTrack.coins * MULTIPLIER.IS_GUEST;
    }

    newTrack.coins += this.calculateAdditionalCoins(track, newTrack.coins);

    return newTrack;
  }

  async update(
    id: string,
    track: UpdateTrackData,
    actor: string,
  ): Promise<ITrack> {
    const trackToUpdate = await this.findTrack(id);
    const before = trackSnapshot(trackToUpdate);

    const updatedValues = this.getCoinsForTrack(trackToUpdate, track);
    const delta = updatedValues.coins - trackToUpdate.coins;

    const change =
      delta === 0
        ? null
        : await this.membersService.changeCoins(trackToUpdate.nickname, {
            season: trackToUpdate.season,
            year: trackToUpdate.year,
            delta,
            actor,
          });

    let updatedTrack: ITrack;

    try {
      updatedTrack = await this.trackModel.findOneAndUpdate(
        { _id: id },
        { $set: updatedValues },
        { new: true },
      );
    } catch (error) {
      if (change) await this.revert(change, actor);

      throw error;
    }

    if (change) {
      const after = trackSnapshot(updatedTrack);

      await this.crumbAudit.record(
        AUDIT_KIND.TRACK_UPDATED,
        actor,
        `Змінено трек «${after.nameTitle}» еп. ${after.currentEpisode}, ${after.nickname}: ${formatCrumbs(before.coins)} → ${formatCrumbs(after.coins)} крихт`,
        [{ change, entryId: id, before, after }],
      );
    }

    return updatedTrack;
  }

  private getCoinsWithMultipliers(
    multipliers: Omit<NewTrack, 'membersInfo'>,
    member: MemberInfo,
  ) {
    if (member.isGuest && member.coins) member.coins = member.coins / 2;

    const allMultipliers = {
      ...pick(multipliers, ['isOngoing', 'isPriority', 'isInTime']),
      isGuest: member.isGuest,
    };
    member.coins += this.calculateAdditionalCoins(allMultipliers, member.coins);

    return member;
  }

  private addAdditionalCoinsToTranslator(track: NewTrack, role: string) {
    const subIndex = track.membersInfo.findIndex(
      (member) => member.typeRole === MEMBER_ROLE.SUB,
    );

    track.membersInfo[subIndex].coins +=
      this.dictionariesService.getCoins()[track.titleType][role];
  }

  async create(input: CreateTrackData, actor: string): Promise<string> {
    const currentUser = await this.usersService.findOneByUsername(
      input.username,
    );

    if (!currentUser)
      throw new HttpException('Такого юзера не існує', HttpStatus.BAD_REQUEST);

    const project = await this.projectsService.findOne(input.projectId);
    const track: NewTrack = {
      ...input,
      nameTitle: project.ukrName,
      titleType: project.titleType,
      ...this.seasonOfTrack(input, project),
    };

    for (const { nickname } of track.membersInfo) {
      const member = await this.membersService.findMember(nickname);

      if (member.deletedAt) {
        throw new HttpException(
          `Нікнейм «${nickname}» видалено зі списку`,
          HttpStatus.CONFLICT,
        );
      }
    }

    if (track.isGiveEditorCoins)
      this.addAdditionalCoinsToTranslator(track, MEMBER_ROLE.EDITOR);
    if (track.isGiveTypesetterCoins)
      this.addAdditionalCoinsToTranslator(track, MEMBER_ROLE.TYPESETTER);

    const year = Number(track.year);
    const done: { id: string; item: CrumbAuditItem }[] = [];

    try {
      for (const member of track.membersInfo) {
        const memberWithMultipliers = this.getCoinsWithMultipliers(
          track,
          member,
        );

        const created = await this.trackModel.create({
          ...memberWithMultipliers,
          ...track,
          year,
        });
        const id = String(created._id);

        let change: CrumbsChange;

        try {
          change = await this.membersService.changeCoins(member.nickname, {
            season: track.season,
            year,
            delta: memberWithMultipliers.coins,
            role: member.typeRole,
            actor,
          });
        } catch (error) {
          await this.trackModel.deleteOne({ _id: id });

          throw error;
        }

        done.push({
          id,
          item: {
            change,
            entryId: id,
            before: null,
            after: trackSnapshot({
              nickname: member.nickname,
              nameTitle: track.nameTitle,
              currentEpisode: track.currentEpisode,
              typeRole: member.typeRole,
              season: track.season,
              year,
              coins: memberWithMultipliers.coins,
            }),
          },
        });
      }
    } catch (error) {
      for (const { id, item } of done.reverse()) {
        await this.revert(item.change, actor);
        await this.trackModel.deleteOne({ _id: id });
      }

      throw error;
    }

    await this.crumbAudit.record(
      AUDIT_KIND.TRACK_CREATED,
      actor,
      `Додано трек «${track.nameTitle}» еп. ${track.currentEpisode}: ${done
        .map(
          ({ item }) =>
            `${item.change.nickname} ${formatSignedCrumbs(item.change.delta)}`,
        )
        .join(', ')}`,
      done.map(({ item }) => item),
    );

    await this.updateProject(track);

    return 'Success';
  }

  // The season the work was done in. A track that names none gets the season of
  // the start of the project, and one that names a season may take any season
  // up to the current one, since a project can be entered long after the work.
  private seasonOfTrack(
    { season, year }: CreateTrackData,
    { startDate }: Project,
  ) {
    if (!season || !year) return seasonOfDay(startDate);

    if (ordinalOf(season, year) > seasonOrdinal(todayInKyiv())) {
      throw new HttpException(
        'Сезон не може бути в майбутньому',
        HttpStatus.BAD_REQUEST,
      );
    }

    return { season, year };
  }

  // The tracks are already written, so a failure here is only logged. The team
  // gets everybody on the track, and the episode counts as released.
  private async updateProject({
    projectId,
    currentEpisode,
    membersInfo,
  }: NewTrack) {
    const attempt = async (what: string, run: () => Promise<void>) => {
      try {
        await run();
      } catch (error) {
        this.logger.error(`Не вдалося ${what} проєкту ${projectId}`, error);
      }
    };

    await attempt('додати учасників у команду', () =>
      this.projectsService.addParticipants(
        projectId,
        membersInfo.map(({ nickname, typeRole }) => ({
          nickname,
          role: typeRole,
        })),
      ),
    );
    await attempt('підняти кількість випущених серій', () =>
      this.projectsService.markEpisodeReleased(projectId, currentEpisode),
    );
  }

  async getCoinsBySeason(): Promise<SeasonCoins[]> {
    const groups = await this.trackModel.aggregate<{
      _id: { season: SEASON; year: number };
      coins: number;
    }>([
      {
        $group: {
          _id: { season: '$season', year: '$year' },
          coins: { $sum: '$coins' },
        },
      },
    ]);

    return groups.map(({ _id, coins }) => ({
      season: _id.season,
      year: _id.year,
      coins: Math.round(coins * 1000) / 1000,
    }));
  }

  // What each nickname earned in each season, hidden members included
  async getCoinsByNickname(): Promise<NicknameCoins[]> {
    const groups = await this.trackModel.aggregate<{
      _id: { nickname: string; season: SEASON; year: number };
      coins: number;
    }>([
      {
        $group: {
          _id: { nickname: '$nickname', season: '$season', year: '$year' },
          coins: { $sum: '$coins' },
        },
      },
    ]);

    return groups.map(({ _id, coins }) => ({
      ..._id,
      coins: Math.round(coins * 1000) / 1000,
    }));
  }

  async getLastTracks(data: LastTracksData): Promise<ITrack[]> {
    const { projectId, episode } = data;
    const queryFilter = { projectId, currentEpisode: episode - 1 };

    const tracks = await this.trackModel
      .find(queryFilter)
      .sort({ createdAt: -1 });

    return tracks;
  }

  // One entry per title text the tracks were written under, oldest track first.
  // A track with no createdAt (kept from before timestamps) is dated by its _id.
  async titleGroups(): Promise<TitleGroup[]> {
    const [groups, members] = await Promise.all([
      this.trackModel.aggregate<
        Omit<TitleGroup, 'nameTitle' | 'members'> & { _id: string }
      >([
        { $match: { nameTitle: { $type: 'string' } } },
        {
          $addFields: {
            at: { $ifNull: ['$createdAt', { $toDate: '$_id' }] },
          },
        },
        { $sort: { at: 1 } },
        {
          $group: {
            _id: '$nameTitle',
            titleType: { $first: '$titleType' },
            season: { $first: '$season' },
            year: { $first: '$year' },
            isOngoing: { $last: '$isOngoing' },
            maxEpisode: { $max: '$currentEpisode' },
            firstAt: { $first: '$at' },
            lastAt: { $last: '$at' },
            tracks: { $sum: 1 },
            unlinked: {
              $sum: { $cond: [{ $ifNull: ['$projectId', false] }, 0, 1] },
            },
            projectId: { $max: '$projectId' },
          },
        },
      ]),
      this.trackModel.aggregate<{
        _id: { nameTitle: string; nickname: string; role: MEMBER_ROLE };
        tracks: number;
      }>([
        { $match: { nameTitle: { $type: 'string' } } },
        {
          $group: {
            _id: {
              nameTitle: '$nameTitle',
              nickname: '$nickname',
              role: '$typeRole',
            },
            tracks: { $sum: 1 },
          },
        },
      ]),
    ]);

    const membersOf = new Map<string, TitleGroup['members']>();

    for (const { _id, tracks } of members) {
      const list = membersOf.get(_id.nameTitle) ?? [];

      list.push({ nickname: _id.nickname, role: _id.role, tracks });
      membersOf.set(_id.nameTitle, list);
    }

    return groups.map(({ _id, projectId, ...group }) => ({
      nameTitle: _id,
      ...group,
      ...(projectId && { projectId }),
      members: membersOf.get(_id) ?? [],
    }));
  }

  // Tracks that were written before they had a project
  countUnlinked(): Promise<number> {
    return this.trackModel.countDocuments({ projectId: { $exists: false } });
  }

  // Links the tracks written under these title texts to a project. The tracks
  // that already have one are left alone, so it can be run again.
  async linkProject(nameTitles: string[], projectId: string): Promise<number> {
    const result = await this.trackModel.updateMany(
      { nameTitle: { $in: nameTitles }, projectId: { $exists: false } },
      { $set: { projectId } },
      { timestamps: false },
    );

    return result.modifiedCount;
  }
}
