import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { ValidatedUser } from '../users/interfaces/user.interface.js';
import { ReconcileService } from './reconcile.service.js';

@ApiTags('Budget reconciliation')
@Controller('budget/reconcile')
@ApiBearerAuth()
export class ReconcileController {
  constructor(private readonly reconcileService: ReconcileService) {}

  @Get()
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({
    summary: 'Add everything up again and show where the sums disagree',
  })
  run() {
    return this.reconcileService.run();
  }

  @Post('opening')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({
    summary: 'Write the opening state of the nicknames the audit has not met',
  })
  writeOpening(@CurrentUser() user: ValidatedUser) {
    return this.reconcileService.writeOpening(user.username);
  }
}
