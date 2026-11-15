import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { ROLE } from '../users/enums/index.js';
import { AdminGuard } from './admin.guard.js';

const contextFor = (request: object) =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('lets an admin through', () => {
    expect(guard.canActivate(contextFor({ user: { role: ROLE.ADMIN } }))).toBe(
      true,
    );
  });

  it.each([ROLE.DIRECTOR, ROLE.MEMBER, 'something-else'])(
    'turns away the %s role',
    (role) => {
      expect(() => guard.canActivate(contextFor({ user: { role } }))).toThrow(
        ForbiddenException,
      );
    },
  );

  it('turns away a request that has no user', () => {
    expect(() => guard.canActivate(contextFor({}))).toThrow(ForbiddenException);
  });
});
