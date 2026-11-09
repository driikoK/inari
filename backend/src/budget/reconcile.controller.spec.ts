import { createMock, type DeepMocked } from '@golevelup/ts-vitest';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { ROLE } from '../users/enums/index.js';
import type { ValidatedUser } from '../users/interfaces/user.interface.js';
import { ReconcileController } from './reconcile.controller.js';
import { ReconcileService } from './reconcile.service.js';

const guardsOf = (handler: (...args: any[]) => unknown): unknown[] =>
  Reflect.getMetadata('__guards__', handler) ?? [];

describe('ReconcileController', () => {
  const admin = {
    _id: 'a1',
    username: 'boss',
    role: ROLE.ADMIN,
  } as ValidatedUser;
  let service: DeepMocked<ReconcileService>;
  let controller: ReconcileController;

  beforeEach(() => {
    service = createMock<ReconcileService>();
    controller = new ReconcileController(service);
  });

  it.each(['run', 'writeOpening'] as const)(
    '%s is for admins only, as it shows every sum and writes to the audit',
    (handler) => {
      expect(guardsOf(ReconcileController.prototype[handler])).toEqual([
        AuthGuard,
        AdminGuard,
      ]);
    },
  );

  it('signs the opening states with the username of the admin', async () => {
    await controller.writeOpening(admin);

    expect(service.writeOpening).toHaveBeenCalledWith('boss');
  });

  it('runs the reconciliation without arguments', async () => {
    await controller.run();

    expect(service.run).toHaveBeenCalledWith();
  });
});
