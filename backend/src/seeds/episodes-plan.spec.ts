import { ANIME_TYPE } from '../shared/index.js';
import {
  describeEpisodePlan,
  type EpisodeProject,
  planEpisodes,
} from './episodes-plan.js';

const project = (extra: Partial<EpisodeProject> = {}): EpisodeProject => ({
  _id: 'p1',
  ukrName: 'Монолог Маомао - 2',
  titleType: ANIME_TYPE.TRAILER,
  episodesReleased: 0,
  ...extra,
});

describe('planEpisodes', () => {
  it('raises a trailer to the newest episode it has a track for', () => {
    expect(planEpisodes([project()], new Map([['p1', 24]]))).toEqual([
      { projectId: 'p1', name: 'Монолог Маомао - 2', from: 0, to: 24 },
    ]);
  });

  it('never lowers a count that is already higher, and leaves a count that is right alone', () => {
    expect(
      planEpisodes(
        [
          project({ _id: 'high', episodesReleased: 30 }),
          project({ _id: 'same', episodesReleased: 12 }),
        ],
        new Map([
          ['high', 24],
          ['same', 12],
        ]),
      ),
    ).toEqual([]);
  });

  it('leaves a trailer with no tracks alone', () => {
    expect(planEpisodes([project()], new Map())).toEqual([]);
  });

  it.each([ANIME_TYPE.SERIES, ANIME_TYPE.FILM, ANIME_TYPE.SHORT_FILM])(
    'does not touch a %s',
    (titleType) => {
      expect(
        planEpisodes([project({ titleType })], new Map([['p1', 24]])),
      ).toEqual([]);
    },
  );

  it('finds nothing the second time, once the plan has been written', () => {
    const first = planEpisodes([project()], new Map([['p1', 7]]));
    const written = project({ episodesReleased: first[0].to });

    expect(planEpisodes([written], new Map([['p1', 7]]))).toEqual([]);
  });

  it('describes a plan as a line of «name: was -> will be»', () => {
    expect(
      describeEpisodePlan({
        projectId: 'p1',
        name: 'Оповідка',
        from: 0,
        to: 3,
      }),
    ).toBe('  Оповідка: 0 -> 3');
  });
});
