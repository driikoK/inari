import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { UsersService } from '../users/users.service.js';
import { AuthGuard } from './auth.guard.js';

describe('AuthGuard', () => {
  const secret = 'test-secret';
  const jwtService = new JwtService({ secret });
  const config = { get: () => secret } as unknown as ConfigService<any, true>;

  let usersService: DeepMocked<UsersService>;
  let guard: AuthGuard;

  const contextFor = (request: object) =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  const bearer = (token: string) => ({
    headers: { authorization: `Bearer ${token}` },
  });

  beforeEach(() => {
    usersService = createMock<UsersService>();
    guard = new AuthGuard(jwtService, config, usersService);
  });

  it('lets a valid token through and exposes the user, with role, on the request', async () => {
    const user = { _id: '1', username: 'ghost', role: 'member' };
    usersService.findOneByUsername.mockResolvedValue(user as never);
    const request: any = bearer(
      await jwtService.signAsync({ username: 'ghost' }),
    );

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);

    expect(request.user).toBe(user);
  });

  it('turns away a valid token whose account was deleted', async () => {
    usersService.findOneByUsername.mockResolvedValue(undefined);
    const request = bearer(await jwtService.signAsync({ username: 'ghost' }));

    await expect(guard.canActivate(contextFor(request))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('turns away a token without a username, like the password-reset one', async () => {
    const request = bearer(await jwtService.signAsync({ email: 'a@b.co' }));

    await expect(guard.canActivate(contextFor(request))).rejects.toThrow(
      UnauthorizedException,
    );
    expect(usersService.findOneByUsername).not.toHaveBeenCalled();
  });

  it('turns away a token signed with another secret', async () => {
    const forged = await new JwtService({ secret: 'other' }).signAsync({
      username: 'ghost',
    });

    await expect(guard.canActivate(contextFor(bearer(forged)))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('turns away a request without a token', async () => {
    await expect(
      guard.canActivate(contextFor({ headers: {} })),
    ).rejects.toThrow(UnauthorizedException);
  });
});
