import type { CreateProjectData } from '../projects/data/index.js';
import { MIN_PROJECT_DAY } from '../projects/enums/index.js';
import {
  ordinalOf,
  seasonOrdinal,
  seasonStartDay,
  todayInKyiv,
} from '../projects/layout.js';
import { ANIME_TYPE, MEMBER_ROLE } from '../shared/index.js';
import type { TitleGroup } from '../tracks/interfaces/track.interface.js';

const MAX_PARTICIPANTS = 50;

export interface TeamTitle {
  name: string;
  createdAt: Date;
  // The project it was moved to, once the migration has run
  projectId?: string;
}

export interface KnownProject {
  _id: string;
  ukrName: string;
  romajiName: string;
  codeName?: string;
  titleType: ANIME_TYPE;
  startDate: string;
  episodesReleased: number;
}

export interface TitlesPlanInput {
  teamTitles: TeamTitle[];
  groups: TitleGroup[];
  projects: KnownProject[];
  today: string;
}

export interface TitlePlan {
  names: string[];
  title: string;
  tracks: number;
  unlinked: number;
  // `moved` is a title that an earlier run has dealt with, nothing is left to do
  action: 'create' | 'link' | 'ambiguous' | 'moved';
  projectId?: string;
  // The released episodes of a project that is there already, when the tracks say more
  raiseTo?: number;
  candidates?: string[];
  project?: CreateProjectData;
  state?: 'active' | 'finished';
  // How many people did not fit into the team of the new project
  leftOut?: number;
  note?: string;
}

const keyOf = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

// A title is active when somebody worked on it, or it was added, since the
// start of the previous season
const isRecent = (day: string, today: string) =>
  seasonOrdinal(day) >= seasonOrdinal(today) - 1;

const searchLink = (name: string) =>
  `https://myanimelist.net/anime.php?q=${encodeURIComponent(name)}&cat=anime`;

const isOf = <T extends string>(values: Record<string, T>, value: unknown) =>
  Object.values(values).includes(value as T);

const ROLE_ORDER: string[] = Object.values(MEMBER_ROLE);

const byName = (a: { nickname: string }, b: { nickname: string }) =>
  a.nickname.localeCompare(b.nickname, 'uk');

// The team of a title: every nickname once with its roles. When there are more
// people than a project holds, the ones with the most tracks stay.
const participantsOf = (members: TitleGroup['members']) => {
  const byNickname = new Map<
    string,
    { nickname: string; roles: MEMBER_ROLE[]; tracks: number }
  >();

  for (const { nickname, role, tracks } of members) {
    const name = nickname?.trim();

    if (!name || !isOf(MEMBER_ROLE, role)) continue;

    const known = byNickname.get(name.toLowerCase()) ?? {
      nickname: name,
      roles: [],
      tracks: 0,
    };

    byNickname.set(name.toLowerCase(), known);
    known.tracks += tracks;
    if (!known.roles.includes(role)) known.roles.push(role);
  }

  const everyone = [...byNickname.values()];
  const kept = [...everyone]
    .sort((a, b) => b.tracks - a.tracks || byName(a, b))
    .slice(0, MAX_PARTICIPANTS);

  return {
    participants: kept.sort(byName).map(({ nickname, roles }) => ({
      nickname,
      roles: roles.sort(
        (a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b),
      ),
    })),
    leftOut: everyone.length - kept.length,
  };
};

interface Spelling {
  names: Set<string>;
  team?: TeamTitle;
  groups: TitleGroup[];
}

const gatherSpellings = (teamTitles: TeamTitle[], groups: TitleGroup[]) => {
  const spellings = new Map<string, Spelling>();
  const spellingOf = (name: string) => {
    const key = keyOf(name);
    const known = spellings.get(key) ?? { names: new Set(), groups: [] };

    spellings.set(key, known);
    known.names.add(name);

    return known;
  };

  for (const team of teamTitles) {
    if (keyOf(team.name)) spellingOf(team.name).team = team;
  }

  for (const group of groups) {
    if (keyOf(group.nameTitle)) spellingOf(group.nameTitle).groups.push(group);
  }

  return spellings;
};

const indexProjects = (projects: KnownProject[]) => {
  const byKey = new Map<string, Map<string, KnownProject>>();

  for (const project of projects) {
    for (const name of [
      project.ukrName,
      project.romajiName,
      project.codeName,
    ]) {
      if (!name || !keyOf(name)) continue;

      const matches = byKey.get(keyOf(name)) ?? new Map();

      matches.set(project._id, project);
      byKey.set(keyOf(name), matches);
    }
  }

  return byKey;
};

const projectOf = (
  title: string,
  { team, groups }: Spelling,
  today: string,
): {
  project: CreateProjectData;
  state: 'active' | 'finished';
  leftOut: number;
} => {
  const first = [...groups].sort(
    (a, b) => a.firstAt.getTime() - b.firstAt.getTime(),
  )[0];
  // The day it was added only counts for a title nobody has written a track for
  const lastAt = groups.length
    ? groups.reduce(
        (latest, { lastAt: at }) => (at > latest ? at : latest),
        groups[0].lastAt,
      )
    : team?.createdAt;
  const firstDay = todayInKyiv(first?.firstAt ?? team?.createdAt);
  const titleOrdinal = first
    ? ordinalOf(first.season, first.year)
    : seasonOrdinal(firstDay);
  const state = isRecent(todayInKyiv(lastAt), today) ? 'active' : 'finished';

  // The season of the project is the season of its start, and it has to be the
  // season the tracks of the title were written in
  let startDate =
    seasonOrdinal(firstDay) === titleOrdinal
      ? firstDay
      : seasonStartDay(titleOrdinal);

  if (startDate > today) startDate = today;
  if (startDate < MIN_PROJECT_DAY) startDate = MIN_PROJECT_DAY;

  const trackType = first?.titleType;
  const titleType =
    trackType && isOf(ANIME_TYPE, trackType) ? trackType : ANIME_TYPE.SERIES;
  const endDay = todayInKyiv(lastAt);
  const endDate =
    endDay < startDate ? startDate : endDay > today ? today : endDay;
  const maxEpisode = Math.max(
    0,
    ...groups.map((group) => group.maxEpisode ?? 0),
  );

  const { participants, leftOut } = participantsOf(
    groups.flatMap(({ members }) => members),
  );

  return {
    state,
    leftOut,
    project: {
      ukrName: title,
      romajiName: title,
      link: searchLink(title),
      titleType,
      isOngoing: first ? !!first.isOngoing : state === 'active',
      isSequel: false,
      startDate,
      episodesReleased: titleType === ANIME_TYPE.SERIES ? maxEpisode : 0,
      participants,
      ...(state === 'finished' && { endDate, isInTime: true }),
    },
  };
};

// One line of the report of the migration
export const describeTitlePlan = (plan: TitlePlan): string => {
  if (plan.action === 'moved') {
    return `  - ${plan.title}: moved already, ${plan.tracks} tracks`;
  }

  if (plan.action === 'ambiguous') {
    return `  ? ${plan.title}: several projects carry this name (${plan.candidates?.join(', ')}), skipped`;
  }

  if (plan.action === 'link' || !plan.project) {
    const raise = plan.raiseTo
      ? `, released episodes raised to ${plan.raiseTo}`
      : '';
    const note = plan.note ? ` (${plan.note})` : '';

    return `  = ${plan.title}: a project already, ${plan.unlinked} of ${plan.tracks} tracks to link${raise}${note}`;
  }

  const { startDate, endDate, participants, episodesReleased } = plan.project;
  const period = endDate ? `${startDate} .. ${endDate}` : `from ${startDate}`;
  const released = episodesReleased
    ? `, ${episodesReleased} episodes released`
    : '';

  const leftOut = plan.leftOut
    ? `, ${plan.leftOut} more people did not fit into the team (it holds ${MAX_PARTICIPANTS}), the ones with the fewest tracks are left out`
    : '';

  return `  + ${plan.title}: ${plan.state} project, ${period}, ${plan.tracks} tracks, ${participants.length} in the team${released}${leftOut}`;
};

// What to do with every title the team has: a title of the old list or one the
// tracks were written under. A title that is a project already is only linked,
// the others become projects. A title an earlier run has moved (its tracks all
// have a project, and the old list says where it went) is left alone, so a
// project renamed or deleted since is not made again.
export const planTitles = ({
  teamTitles,
  groups,
  projects,
  today,
}: TitlesPlanInput): TitlePlan[] => {
  const known = indexProjects(projects);
  const projectsById = new Map(
    projects.map((project) => [project._id, project]),
  );
  const plans: TitlePlan[] = [];

  for (const [key, spelling] of gatherSpellings(teamTitles, groups)) {
    const names = [...spelling.names];
    const title =
      spelling.team?.name.trim() ??
      [...spelling.groups]
        .sort((a, b) => b.tracks - a.tracks)[0]
        .nameTitle.trim();
    const tracks = spelling.groups.reduce(
      (sum, group) => sum + group.tracks,
      0,
    );
    const unlinked = spelling.groups.reduce(
      (sum, group) => sum + group.unlinked,
      0,
    );

    if (unlinked === 0 && (!spelling.team || spelling.team.projectId)) {
      plans.push({ names, title, tracks, unlinked, action: 'moved' });
      continue;
    }

    // The project the title went to earlier wins over the names, which may have changed
    const movedTo =
      spelling.team?.projectId ??
      spelling.groups.find(({ projectId }) => projectId)?.projectId;
    const home = movedTo ? projectsById.get(movedTo) : undefined;
    const matches = home ? [home] : [...(known.get(key)?.values() ?? [])];

    if (matches.length > 1) {
      plans.push({
        names,
        title,
        tracks,
        unlinked,
        action: 'ambiguous',
        candidates: matches.map(({ ukrName }) => ukrName),
      });
    } else if (matches.length === 1) {
      const [match] = matches;
      const first = spelling.groups[0];
      const mismatch =
        first &&
        ordinalOf(first.season, first.year) !== seasonOrdinal(match.startDate);

      const maxEpisode = Math.max(
        0,
        ...spelling.groups.map((group) => group.maxEpisode ?? 0),
      );

      plans.push({
        names,
        title,
        tracks,
        unlinked,
        action: 'link',
        projectId: match._id,
        ...(match.titleType === ANIME_TYPE.SERIES &&
          maxEpisode > match.episodesReleased && { raiseTo: maxEpisode }),
        ...(mismatch && {
          note: 'the season of its tracks is not the season of the start of the project',
        }),
      });
    } else {
      const { project, state, leftOut } = projectOf(title, spelling, today);

      plans.push({
        names,
        title,
        tracks,
        unlinked,
        action: 'create',
        project,
        state,
        ...(leftOut > 0 && { leftOut }),
      });
    }
  }

  return plans.sort((a, b) => a.title.localeCompare(b.title));
};
