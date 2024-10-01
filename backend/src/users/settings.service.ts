import { Injectable } from '@nestjs/common';
import { ICoins, IDub } from './interfaces/settings.interface';

@Injectable()
export class SettingsService {
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

  private getUpdatedCoinsForObject(coeff: number, obj: IDub): IDub {
    const updatedObj: IDub = {} as IDub;

    Object.entries(obj).forEach(([key, value]) => {
      updatedObj[key] = value * coeff;
    });

    return updatedObj;
  }

  private getCoinsByAnimeType(type: 'film' | 'shortFilm') {
    const getUpdatedCoins = (coeff: number, defaultValue: ICoins): ICoins => {
      const updatedValues: ICoins = {} as ICoins;

      Object.entries(defaultValue).forEach(([key, value]) => {
        if (typeof value === 'number') {
          updatedValues[key] = value * coeff;
        } else if (typeof value === 'object' && value !== null) {
          updatedValues[key] = this.getUpdatedCoinsForObject(coeff, value);
        } else {
          updatedValues[key] = value;
        }
      });

      return updatedValues;
    };

    switch (type) {
      case 'film':
        return getUpdatedCoins(2, this.defaultValueOfCoins);
      case 'shortFilm':
        return getUpdatedCoins(0.5, this.defaultValueOfCoins);
    }
  }

  getCoins() {
    return {
      series: {
        type: 'series',
        ...this.defaultValueOfCoins,
      },
      film: {
        type: 'film',
        ...this.getCoinsByAnimeType('film'),
      },
      shortFilm: {
        type: 'shortFilm',
        ...this.getCoinsByAnimeType('shortFilm'),
      },
    };
  }

  getCofsForRoles() {
    return {
      sub: 22, // відсоток від загальної кількості крихт
      dub: 46,
      sound: 12,
      additional: 20,
    };
  }
}
