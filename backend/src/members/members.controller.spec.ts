import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { MembersController } from './members.controller.js';

const guardsOf = (handler: (...args: any[]) => unknown): unknown[] =>
  Reflect.getMetadata('__guards__', handler) ?? [];

describe('MembersController', () => {
  it.each(['updateKind', 'deleteMember'] as const)(
    '%s is for admins only',
    (handler) => {
      expect(guardsOf(MembersController.prototype[handler])).toEqual([
        AuthGuard,
        AdminGuard,
      ]);
    },
  );
});
