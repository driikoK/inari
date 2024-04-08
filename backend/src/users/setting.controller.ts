import { Controller, Get } from '@nestjs/common';

@Controller()
export class SettingController {
  @Get('/coins')
  async getCoin() {
    return {
      film: {
        type: 'film',
        coin: 200,
        coinBonus: 150,
        maxBonusOnRole: 30,
        BonusDirector: 60,
      },
      inTimeStandardAnime: {
        type: 'inTimeStandardAnime',
        coin: 100,
        coinBonus: 70,
        maxBonusOnRole: 10,
        BonusDirector: 10,
      },
      delayStandardAnime: {
        type: 'delayStandardAnime',
        coin: 130,
        coinBonus: 30,
        maxBonusOnRole: 10,
        BonusDirector: 30,
      },
    };
  }

  @Get('/cof')
  async getCof() {
    return {
      sub: 30,
      dub: 55,
      sound: 15,
    };
  }
}
