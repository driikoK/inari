import { PROPOSAL_FUNDING } from '../proposals/enums/index.js';
import { SEASON } from '../shared/index.js';
import { PROJECT_MARK, PROJECT_TIME_ZONE } from './enums/index.js';
import type {
  Project,
  ProjectView,
  SeasonLayout,
  SeasonStats,
} from './interfaces/index.js';

const SEASONS = Object.values(SEASON);
const MONTHS_IN_SEASON = 3;

export const todayInKyiv = (now = new Date()): string =>
  now.toLocaleDateString('sv-SE', { timeZone: PROJECT_TIME_ZONE });

export const seasonOrdinal = (day: string): number => {
  const [year, month] = day.split('-').map(Number);

  return year * SEASONS.length + Math.floor((month - 1) / MONTHS_IN_SEASON);
};

export const seasonOfOrdinal = (ordinal: number) => ({
  season: SEASONS[ordinal % SEASONS.length],
  year: Math.floor(ordinal / SEASONS.length),
});

export const seasonOfDay = (day: string) => seasonOfOrdinal(seasonOrdinal(day));

export const seasonStartDay = (ordinal: number): string => {
  const firstMonth = (ordinal % SEASONS.length) * MONTHS_IN_SEASON + 1;

  return `${seasonOfOrdinal(ordinal).year}-${String(firstMonth).padStart(2, '0')}-01`;
};

export const shiftDays = (day: string, days: number): string => {
  const shifted = new Date(`${day}T00:00:00Z`);

  shifted.setUTCDate(shifted.getUTCDate() + days);

  return shifted.toISOString().slice(0, 10);
};

const markIn = (project: Project, ordinal: number): PROJECT_MARK => {
  const isCarried = seasonOrdinal(project.startDate) < ordinal;
  const isExcused = project.isFinished && project.isInTime;

  if (isCarried && !isExcused) return PROJECT_MARK.DEBT;

  return project.isOngoing ? PROJECT_MARK.ONGOING : PROJECT_MARK.OLD;
};

const statsOf = (projects: ProjectView[]): SeasonStats => ({
  total: projects.length,
  ongoing: projects.filter(({ mark }) => mark === PROJECT_MARK.ONGOING).length,
  old: projects.filter(({ mark }) => mark === PROJECT_MARK.OLD).length,
  debt: projects.filter(({ mark }) => mark === PROJECT_MARK.DEBT).length,
  patron: projects.filter(({ funding }) => funding === PROPOSAL_FUNDING.PATRON)
    .length,
  order: projects.filter(({ funding }) => funding === PROPOSAL_FUNDING.ORDER)
    .length,
});

const byStart = (a: Project, b: Project) =>
  a.startDate.localeCompare(b.startDate) ||
  String(a._id).localeCompare(String(b._id));

export const buildLayout = (
  projects: Project[],
  today: string,
): SeasonLayout[] => {
  const current = seasonOrdinal(today);
  const bySeason = new Map<number, ProjectView[]>([[current, []]]);

  for (const project of [...projects].sort(byStart)) {
    const first = seasonOrdinal(project.startDate);
    const last =
      project.isFinished && project.endDate
        ? seasonOrdinal(project.endDate)
        : current;

    for (let ordinal = first; ordinal <= last; ordinal++) {
      const view = { ...project, mark: markIn(project, ordinal) };
      const group = bySeason.get(ordinal);

      if (group) group.push(view);
      else bySeason.set(ordinal, [view]);
    }
  }

  return [...bySeason.entries()]
    .sort(([a], [b]) => a - b)
    .map(([ordinal, seasonProjects]) => ({
      ...seasonOfOrdinal(ordinal),
      isCurrent: ordinal === current,
      stats: statsOf(seasonProjects),
      projects: seasonProjects,
    }));
};
