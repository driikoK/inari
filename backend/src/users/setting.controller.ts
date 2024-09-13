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
        coin: 400, // загальна кількість крихт, які будуть розподілятися між учасниками
        maxAdditionalOnRole: 30, // максимальна кількість крихт, які можна дати учаснику з додаткових ролей (релізер, розроділяч ролей і тд)
        bonusDirector: 60, // крихти для куратора (вони окремо)
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
      sub: 22, // відсоток від загальної кількості крихт
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
