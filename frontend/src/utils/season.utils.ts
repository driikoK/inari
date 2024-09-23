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

export const convertAnimeTypeEngToUkr = (type: string): string => {
  switch (type) {
    case 'series':
      return 'Серіал';
    case 'film':
      return 'Фільм';
    case 'shortFilm':
      return 'Короткометражка';
    default:
      return '';
  }
};
