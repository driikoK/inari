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
