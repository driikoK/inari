import { Controller, Get, Param } from '@nestjs/common';
import config from 'src/config';

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
      series: {
        type: 'series',
        coin: 200,
        maxAdditionalOnRole: 20,
        bonusDirector: 30,
      },
    };
  }

  @Get('/cof')
  async getCof() {
    return {
      sub: 22,
      dub: 46,
      sound: 12,
      additional: 20,
      fastMultiplier: 1.2,
    };
  }

  @Get('/allow-coins/:password')
  async isAllowCoins(@Param('password') password: string) {
    return password === config.coinsPass;
  }
}
