import { SEASON } from '../shared/index.js';
import { formatCrumbs } from './calc.js';
import {
  crumbRow,
  crumbsKey,
  describeTrack,
  formatSignedCrumbs,
  memberSnapshot,
  openingRow,
  trackSnapshot,
} from './crumbs.js';
import { AUDIT_KIND, AUDIT_UNIT, SIDE_KIND } from './enums/index.js';
import type { OperationHead } from './interfaces/index.js';

const head: OperationHead = {
  operationId: 'op1',
  at: new Date('2027-05-10T09:00:00Z'),
  day: '2027-05-10',
  kind: AUDIT_KIND.TRACK_CREATED,
  actor: 'boss',
  operationDescription: 'Додано трек',
};

const change = {
  nickname: 'Аня',
  season: SEASON.SPRING,
  year: 2027,
  delta: 12.5,
  coins: 112.5,
  seasonCoins: 42.5,
};

describe('formatCrumbs', () => {
  it('shows up to three digits and drops float noise', () => {
    expect(formatCrumbs(0.1 + 0.2)).toBe('0,3');
    expect(formatCrumbs(12.3456)).toBe('12,346');
    expect(formatCrumbs(1200).replace(/\s/g, ' ')).toBe('1 200');
  });

  it('signs a change', () => {
    expect(formatSignedCrumbs(10)).toBe('+10');
    expect(formatSignedCrumbs(-2.5)).toBe('−2,5');
    expect(formatSignedCrumbs(0)).toBe('0');
  });
});

describe('crumbsKey', () => {
  it('is one key for one nickname however it is written', () => {
    expect(crumbsKey(' Аня ')).toBe(crumbsKey('аня'));
    expect(crumbsKey('Аня')).toBe('crumbs:аня');
  });
});

describe('snapshots', () => {
  it('keeps only what explains a track and rounds its coins', () => {
    expect(
      trackSnapshot({
        nickname: 'Аня',
        nameTitle: 'Вітробой',
        currentEpisode: 3,
        typeRole: 'dub',
        season: SEASON.SPRING,
        year: 2027,
        coins: 0.1 + 0.2,
        ...{ _id: 'x', note: 'y' },
      } as any),
    ).toEqual({
      type: 'track',
      nickname: 'Аня',
      nameTitle: 'Вітробой',
      currentEpisode: 3,
      typeRole: 'dub',
      season: SEASON.SPRING,
      year: 2027,
      coins: 0.3,
    });
  });

  it('keeps the total and the seasons of a nickname without database ids', () => {
    expect(
      memberSnapshot({
        nickname: 'Аня',
        coins: 100,
        seasons: [
          { season: SEASON.SPRING, year: 2027, coins: 0.1 + 0.2, _id: 'x' },
        ] as any,
      }),
    ).toEqual({
      type: 'member',
      nickname: 'Аня',
      coins: 100,
      seasons: [{ season: SEASON.SPRING, year: 2027, coins: 0.3 }],
    });
  });

  it('describes a track by title, episode, nickname and crumbs', () => {
    const text = describeTrack(
      trackSnapshot({
        nickname: 'Аня',
        nameTitle: 'Вітробой',
        currentEpisode: 3,
        typeRole: 'dub',
        season: SEASON.SPRING,
        year: 2027,
        coins: 12,
      }),
    );

    expect(text).toBe('«Вітробой» еп. 3, Аня (dub), 12 крихт');
  });

  it('shows the role by a label when it is given one', () => {
    const snapshot = trackSnapshot({
      nickname: 'Аня',
      nameTitle: 'Вітробой',
      currentEpisode: 3,
      typeRole: 'dub',
      season: SEASON.SPRING,
      year: 2027,
      coins: 12,
    });

    expect(describeTrack(snapshot, () => 'Дабер')).toBe(
      '«Вітробой» еп. 3, Аня (Дабер), 12 крихт',
    );
  });
});

describe('crumbRow', () => {
  it('is a row about the crumbs of one nickname, in crumbs and not in money', () => {
    expect(
      crumbRow(head, {
        change,
        entryId: 't1',
        before: null,
        after: null,
      }),
    ).toEqual({
      ...head,
      unit: AUDIT_UNIT.CRUMBS,
      subjectKind: SIDE_KIND.CRUMBS,
      subjectKey: 'crumbs:аня',
      subjectLabel: 'Крихти: Аня',
      deltaCrumbs: 12.5,
      balanceAfterCrumbs: 112.5,
      seasonBalanceAfterCrumbs: 42.5,
      season: SEASON.SPRING,
      year: 2027,
      entryId: 't1',
      before: null,
      after: null,
    });
  });

  it('has no entry id when the change belongs to no record', () => {
    expect(
      crumbRow(head, { change, before: null, after: null }),
    ).not.toHaveProperty('entryId');
  });

  it('rounds float noise out of every number', () => {
    const row = crumbRow(head, {
      change: { ...change, delta: 0.1 + 0.2, coins: 1.0000001 },
      before: null,
      after: null,
    });

    expect(row.deltaCrumbs).toBe(0.3);
    expect(row.balanceAfterCrumbs).toBe(1);
  });
});

describe('openingRow', () => {
  const opening = {
    coins: 100,
    seasons: [
      { season: SEASON.SPRING, year: 2027, coins: 60 },
      { season: SEASON.WINTER, year: 2027, coins: 40 },
    ],
  };

  it('starts the history of a nickname with what it already had', () => {
    expect(openingRow(head, 'Аня', opening, SEASON.SPRING, 2027)).toMatchObject(
      {
        unit: AUDIT_UNIT.CRUMBS,
        subjectKey: 'crumbs:аня',
        deltaCrumbs: 100,
        balanceAfterCrumbs: 100,
        seasonBalanceAfterCrumbs: 60,
        before: null,
        after: {
          type: 'member',
          nickname: 'Аня',
          coins: 100,
          seasons: opening.seasons,
        },
      },
    );
  });

  it('has zero in a season the nickname had not worked in', () => {
    expect(
      openingRow(head, 'Аня', opening, SEASON.FALL, 2027)
        .seasonBalanceAfterCrumbs,
    ).toBe(0);
  });
});
