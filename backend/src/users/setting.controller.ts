import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import config from 'src/config';

@ApiTags('Settings')
@Controller('settings')
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
      shortFilm: {
        type: 'shortFilm',
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
    };
  }

  @Get('/allow-coins/:password')
  async isAllowCoins(@Param('password') password: string) {
    return password === config.coinsPass;
  }
}
