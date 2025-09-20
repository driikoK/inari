import { ANIME_TYPE, CoinsType } from '@/types';
import { maxDurationForShortFilm } from '../const';
import { useCoinsStore } from '@/stores';

export const useCoinsByDuration = (duration: number, animeType: ANIME_TYPE) => {
  const coinsTypes = useCoinsStore((state) => state.coinsTypes);

  const getCoinsDependsOnDuration = (duration: number, animeType: ANIME_TYPE) => {
    if (animeType === ANIME_TYPE.SHORT_FILM && duration > maxDurationForShortFilm) {
      return coinsTypes.series;
    }

    return coinsTypes[animeType as keyof typeof coinsTypes];
  };

  const coins: CoinsType = getCoinsDependsOnDuration(duration, animeType);

  return coins;
};
