import { Controller, Get, UseGuards } from '@nestjs/common';
import { DictionariesService } from './dictionaries.service';
import { AuthGuard } from '@auth/auth.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Dictionaries')
@Controller('dictionaries')
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  @Get('/coins')
  @UseGuards(AuthGuard)
  async getCoin() {
    return this.dictionariesService.getCoins();
  }
}
