import { Injectable } from '@nestjs/common';
import { ICoins, IDub } from './interfaces/dictionaries.interface';
import { MEMBER_ROLE, ANIME_TYPE } from '@shared';

@Injectable()
export class DictionariesService {
  private readonly defaultValueOfCoins: ICoins = {
    coins: 190,
    sub: 30,
    editor: 10,
    dub: {
      double: 50,
      multi: 80,
    },
    fixer: 10,
    roleBreaker: 5,
    sound: 30,
    releaser: 10,
    director: 10,
    typesetter: 10,
  };

  private readonly titleTypeMultipliers = {
    [ANIME_TYPE.FILM]: 2,
    [ANIME_TYPE.SHORT_FILM]: 0.5,
    [ANIME_TYPE.TRAILER]: 0.25,
  };

  private readonly subMultiplierForTrailer = 0.5;

  getCoins() {
    return {
      series: {
        type: ANIME_TYPE.SERIES,
        ...this.defaultValueOfCoins,
      },
      film: {
        type: ANIME_TYPE.FILM,
        ...this.getCoinsByAnimeType(ANIME_TYPE.FILM),
      },
      shortFilm: {
        type: ANIME_TYPE.SHORT_FILM,
        ...this.getCoinsByAnimeType(ANIME_TYPE.SHORT_FILM),
      },
      trailer: {
        type: ANIME_TYPE.TRAILER,
        ...this.getCoinsByAnimeType(ANIME_TYPE.TRAILER),
      },
    };
  }

  private getCoinsByAnimeType(
    type: ANIME_TYPE.FILM | ANIME_TYPE.SHORT_FILM | ANIME_TYPE.TRAILER,
  ) {
    switch (type) {
      case ANIME_TYPE.FILM:
        return this.getUpdatedCoins(
          this.titleTypeMultipliers[ANIME_TYPE.FILM],
          this.defaultValueOfCoins,
        );
      case ANIME_TYPE.SHORT_FILM:
        return this.getUpdatedCoins(
          this.titleTypeMultipliers[ANIME_TYPE.SHORT_FILM],
          this.defaultValueOfCoins,
        );
      case ANIME_TYPE.TRAILER:
        return this.getUpdatedCoins(
          this.titleTypeMultipliers[ANIME_TYPE.TRAILER],
          this.defaultValueOfCoins,
          true,
        );
    }
  }

  private getUpdatedCoins = (
    multiplier: number,
    defaultValue: ICoins,
    moreForSub?: boolean,
  ): ICoins => {
    const updatedValues: ICoins = {} as ICoins;

    Object.entries(defaultValue).forEach(([key, value]) => {
      // ** Special rule for sub role for trailers. They get half of the coins instead of 0.25
      if (key === MEMBER_ROLE.SUB && moreForSub) {
        return (updatedValues[key] = value * this.subMultiplierForTrailer);
      }

      if (typeof value === 'number') {
        updatedValues[key] = value * multiplier;
      } else if (typeof value === 'object' && value !== null) {
        updatedValues[key] = this.getUpdatedCoinsForObject(multiplier, value);
      } else {
        updatedValues[key] = value;
      }
    });

    return updatedValues;
  };

  private getUpdatedCoinsForObject(multiplier: number, obj: IDub): IDub {
    const updatedObj: IDub = {} as IDub;

    Object.entries(obj).forEach(([key, value]) => {
      updatedObj[key] = value * multiplier;
    });

    return updatedObj;
  }
}
