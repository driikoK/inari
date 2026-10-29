import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CuratorGuard } from '../auth/curator.guard.js';
import { MembersController } from './members.controller.js';

const guardsOf = (handler: (...args: any[]) => unknown): unknown[] =>
  Reflect.getMetadata('__guards__', handler) ?? [];

describe('MembersController', () => {
  it.each([
    'updateKind',
    'deleteMember',
    'getCoinsTotal',
    'updateMember',
  ] as const)('%s is for admins only', (handler) => {
    expect(guardsOf(MembersController.prototype[handler])).toEqual([
      AuthGuard,
      AdminGuard,
    ]);
  });

  it('createMember is for curators and admins, as members can never mint crumbs', () => {
    expect(guardsOf(MembersController.prototype.createMember)).toEqual([
      AuthGuard,
      CuratorGuard,
    ]);
  });

  it.each(['getMembers', 'getMyCoins', 'getTypes'] as const)(
    '%s only reads, so any logged-in user may call it',
    (handler) => {
      expect(guardsOf(MembersController.prototype[handler])).toEqual([
        AuthGuard,
      ]);
    },
  );
});
