import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { ValidatedUser } from '../users/interfaces/user.interface.js';
import { ReconcileService } from './reconcile.service.js';

@Controller('budget/reconcile')
export class ReconcileController {
  constructor(private readonly reconcileService: ReconcileService) {}

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  run() {
    return this.reconcileService.run();
  }

  @Post('opening')
  @UseGuards(AuthGuard, AdminGuard)
  writeOpening(@CurrentUser() user: ValidatedUser) {
    return this.reconcileService.writeOpening(user.username);
  }
}
