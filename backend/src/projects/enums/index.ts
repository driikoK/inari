import { ANIME_TYPE } from '../../shared/index.js';

export enum PROJECT_MARK {
  ONGOING = 'ongoing',
  OLD = 'old',
  DEBT = 'debt',
  PLANNED = 'planned',
}

// The types that have a count of released episodes: a series and the trailers
// the team calls «оповідки»
export const EPISODE_TYPES = [ANIME_TYPE.SERIES, ANIME_TYPE.TRAILER];

export const MAX_PLANNED_YEARS = 2;

export const PROJECT_TIME_ZONE = 'Europe/Kyiv';

export const MIN_PROJECT_DAY = '2000-01-01';

export const MAX_PARTICIPANTS = 50;
