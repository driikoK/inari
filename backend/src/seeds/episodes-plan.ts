import { ANIME_TYPE } from '../shared/index.js';

export interface EpisodeProject {
  _id: string;
  ukrName: string;
  titleType: ANIME_TYPE;
  episodesReleased: number;
}

export interface EpisodePlan {
  projectId: string;
  name: string;
  from: number;
  to: number;
}

// The count of released episodes of a trailer project only ever grows to the
// newest episode with a track, which is what a track does when it is written.
// This catches up the trailers that were written before they had a count.
export const planEpisodes = (
  projects: EpisodeProject[],
  maxEpisodes: Map<string, number>,
): EpisodePlan[] =>
  projects
    .filter(({ titleType }) => titleType === ANIME_TYPE.TRAILER)
    .flatMap(({ _id, ukrName, episodesReleased }) => {
      const newest = maxEpisodes.get(_id) ?? 0;

      return newest > episodesReleased
        ? [
            {
              projectId: _id,
              name: ukrName,
              from: episodesReleased,
              to: newest,
            },
          ]
        : [];
    });

export const describeEpisodePlan = ({ name, from, to }: EpisodePlan): string =>
  `  ${name}: ${from} -> ${to}`;
