import { createMock, type DeepMocked } from '@golevelup/ts-vitest';
import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { ROLE } from '../users/enums/index.js';
import type { ValidatedUser } from '../users/interfaces/user.interface.js';
import { RequestsController } from './requests.controller.js';
import { RequestsService } from './requests.service.js';

const guardsOf = (handler: (...args: any[]) => unknown): unknown[] =>
  Reflect.getMetadata('__guards__', handler) ?? [];

describe('RequestsController', () => {
  const admin = {
    _id: 'a1',
    username: 'boss',
    role: ROLE.ADMIN,
  } as ValidatedUser;
  let service: DeepMocked<RequestsService>;
  let controller: RequestsController;

  beforeEach(() => {
    service = createMock<RequestsService>();
    controller = new RequestsController(service);
  });

  it.each(['mine', 'preview', 'create', 'cancel'] as const)(
    '%s is for any logged-in user, as it only touches their own nickname',
    (handler) => {
      expect(guardsOf(RequestsController.prototype[handler])).toEqual([
        AuthGuard,
      ]);
    },
  );

  it.each(['queue', 'fulfil', 'reject'] as const)(
    '%s is for admins only, as it shows card numbers or moves money',
    (handler) => {
      expect(guardsOf(RequestsController.prototype[handler])).toEqual([
        AuthGuard,
        AdminGuard,
      ]);
    },
  );

  it('signs a fulfilment and a rejection with the username of the admin', async () => {
    await controller.fulfil('r1', { amountKop: 100 }, admin);
    await controller.reject('r2', admin);

    expect(service.fulfil).toHaveBeenCalledWith(
      'r1',
      { amountKop: 100 },
      'boss',
    );
    expect(service.reject).toHaveBeenCalledWith('r2', 'boss');
  });

  it('hands the user to the service, which takes the nickname from it', async () => {
    const data = { isOrder: false, lines: [] } as any;

    await controller.create(data, admin);
    await controller.preview(data, admin);
    await controller.cancel('r3', admin);
    await controller.mine(admin);

    expect(service.create).toHaveBeenCalledWith(admin, data);
    expect(service.preview).toHaveBeenCalledWith(admin, data);
    expect(service.cancel).toHaveBeenCalledWith(admin, 'r3');
    expect(service.mine).toHaveBeenCalledWith(admin);
  });
});
