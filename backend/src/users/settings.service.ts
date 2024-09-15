import { Injectable } from '@nestjs/common';

@Injectable()
export class SettingsService {
  getCoins() {
    return {
      film: {
        type: 'film',
        coins: 380,
        sub: 60,
        editor: 10,
        dub: {
          double: 100,
          multi: 160,
        },
        fixer: 20,
        roleBreaker: 10,
        sound: 60,
        releaser: 20,
        director: 20,
        another: 20,
      },
      series: {
        type: 'series',
        coins: 190,
        sub: 30,
        editor: 5,
        dub: {
          double: 50,
          multi: 80,
        },
        fixer: 10,
        roleBreaker: 5,
        sound: 30,
        releaser: 10,
        director: 10,
        another: 10,
      },
      shortFilm: {
        type: 'shortFilm',
        coins: 190,
        sub: 30,
        editor: 5,
        dub: {
          double: 50,
          multi: 80,
        },
        fixer: 10,
        roleBreaker: 5,
        sound: 30,
        releaser: 10,
        director: 10,
        another: 10,
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
