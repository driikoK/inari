import { Controller, Get, UseGuards } from '@nestjs/common';
import { DictionariesService } from './dictionaries.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Dictionaries')
@Controller('dictionaries')
@ApiBearerAuth()
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  @Get('/coins')
  @UseGuards(AuthGuard)
  async getCoin() {
    return this.dictionariesService.getCoins();
  }
}
