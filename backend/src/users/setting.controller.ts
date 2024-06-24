import { Controller, Get } from '@nestjs/common';

@Controller()
export class SettingController {
  @Get('/coins')
  async getCoin() {
    return {
      film: {
        type: 'film',
        coin: 400,
        maxAdditionalOnRole: 30,
        bonusDirector: 60,
      },
      inTimeStandardAnime: {
        type: 'inTimeStandardAnime',
        coin: 200,
        maxAdditionalOnRole: 20,
        bonusDirector: 30,
      },
      delayStandardAnime: {
        type: 'delayStandardAnime',
        coin: 150,
        maxAdditionalOnRole: 10,
        bonusDirector: 10,
      },
    };
  }

  @Get('/cof')
  async getCof() {
    return {
      sub: 25,
      dub: 48,
      sound: 12,
      additional: 15,
    };
  }
}
