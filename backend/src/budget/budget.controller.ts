import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { ValidatedUser } from '../users/interfaces/user.interface.js';
import { BudgetAuditService } from './budget-audit.service.js';
import { BudgetService } from './budget.service.js';
import {
  AuditQueryData,
  CreateIncomesData,
  EntriesQueryData,
  UpdateIncomeData,
} from './data/index.js';

@ApiTags('Budget')
@Controller('budget')
@ApiBearerAuth()
export class BudgetController {
  constructor(
    private readonly budgetService: BudgetService,
    private readonly auditService: BudgetAuditService,
  ) {}

  @Get('summary')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Totals of the team budget, in kopiykas' })
  summary() {
    return this.budgetService.getSummary();
  }

  @Get('entries')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'The journal: every record, newest first' })
  entries(@Query({ schema: EntriesQueryData }) query: EntriesQueryData) {
    return this.budgetService.findEntries(query);
  }

  @Post('incomes')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Add several incomes with one date and season' })
  createIncomes(
    @Body({ schema: CreateIncomesData }) data: CreateIncomesData,
    @CurrentUser() user: ValidatedUser,
  ) {
    return this.budgetService.createIncomes(data, user.username);
  }

  @Put('entries/:id')
  @UseGuards(AuthGuard, AdminGuard)
  updateEntry(
    @Param('id') id: string,
    @Body({ schema: UpdateIncomeData }) data: UpdateIncomeData,
    @CurrentUser() user: ValidatedUser,
  ) {
    return this.budgetService.updateEntry(id, data, user.username);
  }

  @Delete('entries/:id')
  @UseGuards(AuthGuard, AdminGuard)
  deleteEntry(@Param('id') id: string, @CurrentUser() user: ValidatedUser) {
    return this.budgetService.deleteEntry(id, user.username);
  }

  @Get('audit')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Append-only history of every money operation' })
  audit(@Query({ schema: AuditQueryData }) query: AuditQueryData) {
    return this.auditService.find(query);
  }
}
