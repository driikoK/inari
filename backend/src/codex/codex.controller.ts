import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { ValidatedUser } from '../users/interfaces/user.interface.js';
import { CodexService } from './codex.service.js';
import { SaveCodexData } from './data/codex.data.js';

@Controller('codex')
export class CodexController {
  constructor(private readonly codexService: CodexService) {}

  @Get()
  @UseGuards(AuthGuard)
  get() {
    return this.codexService.get();
  }

  @Put()
  @UseGuards(AuthGuard, AdminGuard)
  save(
    @Body({ schema: SaveCodexData }) data: SaveCodexData,
    @CurrentUser() user: ValidatedUser,
  ) {
    return this.codexService.save(data, user.username);
  }
}
