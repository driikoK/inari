import { ANIME_TYPE } from '@/types';

export const convertSeasonEngToUkr = (season: string): string => {
  switch (season) {
    case 'spring':
      return 'Весна';
    case 'summer':
      return 'Літо';
    case 'fall':
      return 'Осінь';
    case 'winter':
      return 'Зима';
    default:
      return '';
  }
};

export const convertAnimeTypeEngToUkr = (type: ANIME_TYPE): string => {
  switch (type) {
    case ANIME_TYPE.SERIES:
      return 'Серіал';
    case ANIME_TYPE.FILM:
      return 'Фільм';
    case ANIME_TYPE.SHORT_FILM:
      return 'Короткометражка';
    default:
      return '';
  }
};
