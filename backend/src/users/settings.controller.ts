import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import config from 'src/config';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@Controller('settings')
export class SettingController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('/coins')
  async getCoin() {
    return this.settingsService.getCoins();
  }

  @Get('/cof')
  async getCof() {
    return this.settingsService.getCofsForRoles();
  }

  @Get('/allow-coins/:password')
  async isAllowCoins(@Param('password') password: string) {
    return password === config.coinsPass;
  }
}
