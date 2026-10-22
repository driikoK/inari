import { Types } from 'mongoose';

import { PROPOSAL_FUNDING } from '../proposals/enums/index.js';
import { ANIME_TYPE, SEASON } from '../shared/index.js';
import { PROJECT_MARK } from './enums/index.js';
import type { Project } from './interfaces/index.js';
import {
  buildLayout,
  seasonOfDay,
  seasonOrdinal,
  seasonStartDay,
  shiftDays,
  todayInKyiv,
} from './layout.js';

const TODAY = '2027-05-10';

const project = (extra: Partial<Project> = {}): Project => ({
  _id: new Types.ObjectId(),
  ukrName: 'Вітробой',
  romajiName: 'Wind Breaker',
  link: 'https://myanimelist.net/anime/54900',
  titleType: ANIME_TYPE.SERIES,
  isOngoing: true,
  isSequel: false,
  startDate: '2027-04-02',
  isFinished: false,
  isInTime: false,
  episodesReleased: 0,
  participants: [],
  ...extra,
});

const label = ({ season, year }: { season: SEASON; year: number }) =>
  `${season} ${year}`;

const currentOf = (layout: ReturnType<typeof buildLayout>) => {
  const entry = layout.find(({ isCurrent }) => isCurrent);

  if (!entry) throw new Error('No current season in the layout');

  return entry;
};

const marksIn = (layout: ReturnType<typeof buildLayout>, season: string) =>
  layout
    .find((entry) => label(entry) === season)
    ?.projects.map(({ mark }) => mark);

describe('seasonOrdinal', () => {
  it('puts the last day of a quarter in it and the next day in the next one', () => {
    expect(seasonOrdinal('2027-03-31')).toBe(seasonOrdinal('2027-01-01'));
    expect(seasonOrdinal('2027-04-01')).toBe(seasonOrdinal('2027-03-31') + 1);
    expect(seasonOrdinal('2027-12-31')).toBe(seasonOrdinal('2027-10-01'));
  });

  it('runs straight over the turn of the year', () => {
    expect(seasonOrdinal('2028-01-01')).toBe(seasonOrdinal('2027-12-31') + 1);
  });
});

describe('seasonOfDay', () => {
  it.each([
    ['2027-01-01', SEASON.WINTER, 2027],
    ['2027-05-10', SEASON.SPRING, 2027],
    ['2027-09-30', SEASON.SUMMER, 2027],
    ['2027-12-31', SEASON.FALL, 2027],
  ])('puts %s in %s %i', (day, season, year) => {
    expect(seasonOfDay(day)).toEqual({ season, year });
  });
});

describe('seasonStartDay', () => {
  it.each([
    ['2027-01-15', '2027-01-01'],
    ['2027-05-10', '2027-04-01'],
    ['2027-09-30', '2027-07-01'],
    ['2026-12-31', '2026-10-01'],
  ])('puts %s in a season that starts on %s', (day, start) => {
    expect(seasonStartDay(seasonOrdinal(day))).toBe(start);
  });

  it('steps back over the turn of the year', () => {
    expect(seasonStartDay(seasonOrdinal('2027-02-01') - 1)).toBe('2026-10-01');
  });
});

describe('shiftDays', () => {
  it.each([
    ['2027-05-10', 10, '2027-05-20'],
    ['2027-05-10', -10, '2027-04-30'],
    ['2027-12-31', 1, '2028-01-01'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2027-05-10', 0, '2027-05-10'],
  ])('moves %s by %i days to %s', (day, days, shifted) => {
    expect(shiftDays(day, days)).toBe(shifted);
  });
});

describe('todayInKyiv', () => {
  it('takes the date in Kyiv, which is already tomorrow late in the evening UTC', () => {
    expect(todayInKyiv(new Date('2027-05-10T21:30:00Z'))).toBe('2027-05-11');
    expect(todayInKyiv(new Date('2027-05-10T12:00:00Z'))).toBe('2027-05-10');
  });
});

describe('buildLayout', () => {
  it('always has the current season, even with no projects', () => {
    const layout = buildLayout([], TODAY);

    expect(layout).toHaveLength(1);
    expect(layout[0]).toMatchObject({
      season: SEASON.SPRING,
      year: 2027,
      isCurrent: true,
      stats: { total: 0, ongoing: 0, old: 0, debt: 0, patron: 0, order: 0 },
    });
  });

  it('marks a project started this season by its kind', () => {
    const layout = buildLayout(
      [project(), project({ isOngoing: false, startDate: '2027-05-01' })],
      TODAY,
    );

    expect(marksIn(layout, 'spring 2027')).toEqual([
      PROJECT_MARK.ONGOING,
      PROJECT_MARK.OLD,
    ]);
  });

  it('carries an unfinished project into every later season as a debt', () => {
    const layout = buildLayout([project({ startDate: '2026-11-15' })], TODAY);

    expect(layout.map(label)).toEqual([
      'fall 2026',
      'winter 2027',
      'spring 2027',
    ]);
    expect(layout.map(({ projects }) => projects[0].mark)).toEqual([
      PROJECT_MARK.ONGOING,
      PROJECT_MARK.DEBT,
      PROJECT_MARK.DEBT,
    ]);
  });

  it('counts a debt in place of its kind, so ongoing, old and debt add up to the total', () => {
    const layout = buildLayout(
      [
        project({ startDate: '2027-02-10' }),
        project({ startDate: '2027-02-12', isOngoing: false }),
        project(),
        project({ isOngoing: false }),
        project({ isOngoing: false }),
      ],
      TODAY,
    );
    const { stats } = currentOf(layout);

    expect(stats).toMatchObject({ total: 5, ongoing: 1, old: 2, debt: 2 });
    expect(stats.ongoing + stats.old + stats.debt).toBe(stats.total);
  });

  it('counts patron and order projects on top of their kind', () => {
    const layout = buildLayout(
      [
        project({ funding: PROPOSAL_FUNDING.PATRON }),
        project({ funding: PROPOSAL_FUNDING.PATRON, isOngoing: false }),
        project({ funding: PROPOSAL_FUNDING.ORDER }),
        project(),
      ],
      TODAY,
    );
    const { stats } = currentOf(layout);

    expect(stats).toMatchObject({ total: 4, patron: 2, order: 1 });
  });

  it('keeps a project finished in its own season out of later seasons', () => {
    const layout = buildLayout(
      [
        project({
          startDate: '2027-01-10',
          isFinished: true,
          endDate: '2027-03-20',
        }),
      ],
      TODAY,
    );

    expect(marksIn(layout, 'winter 2027')).toEqual([PROJECT_MARK.ONGOING]);
    expect(marksIn(layout, 'spring 2027')).toEqual([]);
  });

  it('makes a project finished late a debt in the season it ended in', () => {
    const layout = buildLayout(
      [
        project({
          startDate: '2027-01-10',
          isFinished: true,
          endDate: '2027-04-03',
        }),
      ],
      TODAY,
    );

    expect(marksIn(layout, 'winter 2027')).toEqual([PROJECT_MARK.ONGOING]);
    expect(marksIn(layout, 'spring 2027')).toEqual([PROJECT_MARK.DEBT]);
  });

  it('shows its kind instead of a debt when it was finished in time', () => {
    const layout = buildLayout(
      [
        project({
          startDate: '2027-01-10',
          isFinished: true,
          isInTime: true,
          endDate: '2027-04-03',
        }),
      ],
      TODAY,
    );
    const { stats } = currentOf(layout);

    expect(marksIn(layout, 'spring 2027')).toEqual([PROJECT_MARK.ONGOING]);
    expect(stats).toMatchObject({ total: 1, ongoing: 1, debt: 0 });
  });

  it('does not excuse an unfinished project, whatever its in-time flag says', () => {
    const layout = buildLayout(
      [project({ startDate: '2027-01-10', isInTime: true })],
      TODAY,
    );

    expect(marksIn(layout, 'spring 2027')).toEqual([PROJECT_MARK.DEBT]);
  });

  it('lists only seasons that have a project, plus the current one', () => {
    const layout = buildLayout(
      [
        project({
          startDate: '2026-10-05',
          isFinished: true,
          endDate: '2026-12-20',
        }),
      ],
      TODAY,
    );

    expect(layout.map(label)).toEqual(['fall 2026', 'spring 2027']);
  });

  it('flags only the current season', () => {
    const layout = buildLayout([project({ startDate: '2027-01-10' })], TODAY);

    expect(layout.map(({ isCurrent }) => isCurrent)).toEqual([false, true]);
  });

  it('orders each season by start date, oldest first', () => {
    const late = project({ ukrName: 'Пізній', startDate: '2027-05-02' });
    const early = project({ ukrName: 'Ранній', startDate: '2027-04-02' });
    const carried = project({ ukrName: 'Борг', startDate: '2027-01-20' });

    const layout = buildLayout([late, early, carried], TODAY);
    const spring = currentOf(layout);

    expect(spring.projects.map(({ ukrName }) => ukrName)).toEqual([
      'Борг',
      'Ранній',
      'Пізній',
    ]);
  });
});
