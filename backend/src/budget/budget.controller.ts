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
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard, CurrentUser } from '../auth/auth.guard.js';
import type { ValidatedUser } from '../users/interfaces/user.interface.js';
import { BudgetAuditService } from './budget-audit.service.js';
import { BudgetService } from './budget.service.js';
import {
  AuditQueryData,
  CreateExpensesData,
  CreateIncomesData,
  EntriesQueryData,
  UpdateExpenseData,
  UpdateIncomeData,
  UpdateSupportData,
} from './data/index.js';

@Controller('budget')
export class BudgetController {
  constructor(
    private readonly budgetService: BudgetService,
    private readonly auditService: BudgetAuditService,
  ) {}

  @Get('summary')
  @UseGuards(AuthGuard)
  summary() {
    return this.budgetService.getSummary();
  }

  @Get('entries')
  @UseGuards(AuthGuard, AdminGuard)
  entries(@Query({ schema: EntriesQueryData }) query: EntriesQueryData) {
    return this.budgetService.findEntries(query);
  }

  @Post('incomes')
  @UseGuards(AuthGuard, AdminGuard)
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

  @Post('expenses')
  @UseGuards(AuthGuard, AdminGuard)
  createExpenses(
    @Body({ schema: CreateExpensesData }) data: CreateExpensesData,
    @CurrentUser() user: ValidatedUser,
  ) {
    return this.budgetService.createExpenses(data, user.username);
  }

  @Put('expenses/:id')
  @UseGuards(AuthGuard, AdminGuard)
  updateExpense(
    @Param('id') id: string,
    @Body({ schema: UpdateExpenseData }) data: UpdateExpenseData,
    @CurrentUser() user: ValidatedUser,
  ) {
    return this.budgetService.updateExpense(id, data, user.username);
  }

  @Post('support/preview')
  @UseGuards(AuthGuard, AdminGuard)
  previewSupport(@Body({ schema: UpdateSupportData }) data: UpdateSupportData) {
    return this.budgetService.previewSupport(data);
  }

  @Put('support')
  @UseGuards(AuthGuard, AdminGuard)
  updateSupport(
    @Body({ schema: UpdateSupportData }) data: UpdateSupportData,
    @CurrentUser() user: ValidatedUser,
  ) {
    return this.budgetService.updateSupport(data, user.username);
  }

  @Delete('entries/:id')
  @UseGuards(AuthGuard, AdminGuard)
  deleteEntry(@Param('id') id: string, @CurrentUser() user: ValidatedUser) {
    return this.budgetService.deleteEntry(id, user.username);
  }

  @Get('audit')
  @UseGuards(AuthGuard, AdminGuard)
  audit(@Query({ schema: AuditQueryData }) query: AuditQueryData) {
    return this.auditService.find(query);
  }
}
