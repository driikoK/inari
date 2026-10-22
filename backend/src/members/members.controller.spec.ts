import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { MembersController } from './members.controller.js';

const guardsOf = (handler: (...args: any[]) => unknown): unknown[] =>
  Reflect.getMetadata('__guards__', handler) ?? [];

describe('MembersController', () => {
  it.each(['updateKind', 'deleteMember', 'getCoinsTotal'] as const)(
    '%s is for admins only',
    (handler) => {
      expect(guardsOf(MembersController.prototype[handler])).toEqual([
        AuthGuard,
        AdminGuard,
      ]);
    },
  );

  it('getMyCoins is for any logged-in user, as it only answers their own nickname', () => {
    expect(guardsOf(MembersController.prototype.getMyCoins)).toEqual([
      AuthGuard,
    ]);
  });
});
