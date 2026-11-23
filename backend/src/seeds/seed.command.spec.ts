import { createMock } from '@golevelup/ts-vitest';
import type { Mongoose } from 'mongoose';
import { Types } from 'mongoose';
import { vi } from 'vitest';

import type { BudgetService } from '../budget/budget.service.js';
import type { ConfigService } from '@nestjs/config';
import type { MembersService } from '../members/members.service.js';
import type { Project } from '../projects/interfaces/index.js';
import type { ProjectsService } from '../projects/projects.service.js';
import type { ProposalsService } from '../proposals/proposals.service.js';
import { ANIME_TYPE } from '../shared/index.js';
import type { TeamAnimesService } from '../team-animes/team-animes.service.js';
import type { TrackService } from '../tracks/tracks.service.js';
import type { UsersService } from '../users/users.service.js';
import { SeedCommand } from './seed.command.js';

describe('SeedCommand.backfillEpisodes', () => {
  const behind = new Types.ObjectId();
  const alsoBehind = new Types.ObjectId();
  const fine = new Types.ObjectId();
  const series = new Types.ObjectId();

  const project = (extra: Partial<Project>): Project =>
    ({
      ukrName: 'Оповідка',
      titleType: ANIME_TYPE.TRAILER,
      episodesReleased: 0,
      ...extra,
    }) as Project;

  let projects: ReturnType<typeof createMock<ProjectsService>>;
  let tracks: ReturnType<typeof createMock<TrackService>>;
  let command: SeedCommand;
  let log: ReturnType<typeof vi.spyOn>;

  const printed = () => log.mock.calls.map(([line]) => String(line));

  beforeEach(() => {
    projects = createMock<ProjectsService>();
    tracks = createMock<TrackService>();
    projects.list.mockResolvedValue([
      project({ _id: behind, ukrName: 'Перша' }),
      project({ _id: alsoBehind, ukrName: 'Друга', episodesReleased: 2 }),
      project({ _id: fine, ukrName: 'Готова', episodesReleased: 12 }),
      project({
        _id: series,
        ukrName: 'Серіал',
        titleType: ANIME_TYPE.SERIES,
      }),
    ]);
    tracks.maxEpisodes.mockResolvedValue(
      new Map([
        [String(behind), 8],
        [String(alsoBehind), 5],
        [String(fine), 12],
        [String(series), 40],
      ]),
    );
    command = new SeedCommand(
      createMock<Mongoose>(),
      createMock<BudgetService>(),
      createMock<UsersService>(),
      createMock<MembersService>(),
      createMock<ProposalsService>(),
      projects,
      createMock<TeamAnimesService>(),
      tracks,
      createMock<ConfigService<never, true>>(),
    );
    log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    log.mockRestore();
  });

  it('lists what it would raise and writes nothing in a dry run', async () => {
    await command.backfillEpisodes(true);

    expect(printed()).toEqual([
      'backfill:episodes (dry run) - 2 trailer projects to raise',
      '  Перша: 0 -> 8',
      '  Друга: 2 -> 5',
    ]);
    expect(projects.markEpisodeReleased).not.toHaveBeenCalled();
  });

  it('raises the trailers that are behind, and not the ones that are not, a series included', async () => {
    projects.markEpisodeReleased.mockResolvedValue(true);

    await command.backfillEpisodes(false);

    expect(projects.markEpisodeReleased.mock.calls).toEqual([
      [String(behind), 8],
      [String(alsoBehind), 5],
    ]);
    expect(printed().at(-1)).toBe('backfill:episodes - raised 2 of 2 projects');
  });

  it('counts what it really wrote: a project raised by a track meanwhile is not counted', async () => {
    projects.markEpisodeReleased
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await command.backfillEpisodes(false);

    expect(printed().at(-1)).toBe('backfill:episodes - raised 1 of 2 projects');
  });

  it('has nothing to do once the counts are right', async () => {
    projects.list.mockResolvedValue([
      project({ _id: fine, ukrName: 'Готова', episodesReleased: 12 }),
    ]);
    projects.markEpisodeReleased.mockResolvedValue(true);

    await command.backfillEpisodes(false);

    expect(printed()).toEqual([
      'backfill:episodes - 0 trailer projects to raise',
      'backfill:episodes - raised 0 of 0 projects',
    ]);
    expect(projects.markEpisodeReleased).not.toHaveBeenCalled();
  });
});
