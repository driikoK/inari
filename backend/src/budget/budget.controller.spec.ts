import { createMock, type DeepMocked } from '@golevelup/ts-vitest';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { SEASON } from '../shared/index.js';
import { ROLE } from '../users/enums/index.js';
import type { ValidatedUser } from '../users/interfaces/user.interface.js';
import { BudgetAuditService } from './budget-audit.service.js';
import { BudgetController } from './budget.controller.js';
import { BudgetService } from './budget.service.js';
import { INCOME_SOURCE } from './enums/index.js';

const guardsOf = (handler: (...args: any[]) => unknown): unknown[] =>
  Reflect.getMetadata('__guards__', handler) ?? [];

describe('BudgetController', () => {
  const admin = {
    _id: 'a1',
    username: 'boss',
    role: ROLE.ADMIN,
  } as ValidatedUser;

  let budgetService: DeepMocked<BudgetService>;
  let auditService: DeepMocked<BudgetAuditService>;
  let controller: BudgetController;

  beforeEach(() => {
    budgetService = createMock<BudgetService>();
    auditService = createMock<BudgetAuditService>();
    controller = new BudgetController(budgetService, auditService);
  });

  it('shows the summary to any logged-in user', () => {
    expect(guardsOf(BudgetController.prototype.summary)).toEqual([AuthGuard]);
  });

  it.each([
    'entries',
    'createIncomes',
    'updateEntry',
    'createExpenses',
    'updateExpense',
    'updateSupport',
    'previewSupport',
    'deleteEntry',
    'audit',
  ] as const)('%s is for admins only', (handler) => {
    expect(guardsOf(BudgetController.prototype[handler])).toEqual([
      AuthGuard,
      AdminGuard,
    ]);
  });

  it('signs every change with the username of the admin', async () => {
    const period = { date: '2027-05-10', season: SEASON.SPRING, year: 2027 };
    const line = { source: INCOME_SOURCE.TEAM_JAR, amountKop: 100 };

    await controller.createIncomes({ ...period, lines: [line] }, admin);
    await controller.updateEntry('e1', { ...period, ...line }, admin);
    await controller.deleteEntry('e1', admin);
    await controller.createExpenses(
      { date: period.date, lines: [] } as any,
      admin,
    );
    await controller.updateExpense('e1', {} as any, admin);
    await controller.updateSupport({} as any, admin);

    expect(budgetService.createIncomes).toHaveBeenCalledWith(
      expect.anything(),
      'boss',
    );
    expect(budgetService.updateEntry).toHaveBeenCalledWith(
      'e1',
      expect.anything(),
      'boss',
    );
    expect(budgetService.deleteEntry).toHaveBeenCalledWith('e1', 'boss');
    expect(budgetService.createExpenses).toHaveBeenCalledWith(
      expect.anything(),
      'boss',
    );
    expect(budgetService.updateExpense).toHaveBeenCalledWith(
      'e1',
      expect.anything(),
      'boss',
    );
    expect(budgetService.updateSupport).toHaveBeenCalledWith(
      expect.anything(),
      'boss',
    );
  });

  it('previews the support budgets without a username, as it writes nothing', async () => {
    const data = { targets: [] } as any;

    await controller.previewSupport(data);

    expect(budgetService.previewSupport).toHaveBeenCalledWith(data);
  });

  it('reads the audit from the audit service', async () => {
    await controller.audit({ page: 1, perPage: 20 });

    expect(auditService.find).toHaveBeenCalledWith({ page: 1, perPage: 20 });
  });
});
