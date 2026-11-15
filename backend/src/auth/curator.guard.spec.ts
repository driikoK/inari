import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { ROLE } from '../users/enums/index.js';
import { CuratorGuard } from './curator.guard.js';

const contextFor = (request: object) =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
  }) as unknown as ExecutionContext;

describe('CuratorGuard', () => {
  const guard = new CuratorGuard();

  it.each([ROLE.ADMIN, ROLE.DIRECTOR])('lets the %s role through', (role) => {
    expect(guard.canActivate(contextFor({ user: { role } }))).toBe(true);
  });

  it.each([ROLE.MEMBER, 'something-else'])('turns away the %s role', (role) => {
    expect(() => guard.canActivate(contextFor({ user: { role } }))).toThrow(
      ForbiddenException,
    );
  });

  it('turns away a request that has no user', () => {
    expect(() => guard.canActivate(contextFor({}))).toThrow(ForbiddenException);
  });
});
