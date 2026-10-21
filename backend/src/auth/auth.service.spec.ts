import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';
import bcrypt from 'bcrypt';

import { EmailService } from '../email/email.service.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  const password = 'correct horse battery staple';

  let authService: AuthService;
  let jwtService: JwtService;
  let usersService: DeepMocked<UsersService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: createMock<UsersService>() },
        { provide: EmailService, useValue: createMock<EmailService>() },
        {
          provide: JwtService,
          useValue: new JwtService({ secret: 'test-secret' }),
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    jwtService = module.get(JwtService);
    usersService = module.get(UsersService);

    usersService.findOneByUsername.mockResolvedValue({
      username: 'root',
      password: await bcrypt.hash(password, 4),
    } as never);
  });

  describe('login', () => {
    it('signs a token that carries nothing but the username', async () => {
      const { accessToken } = await authService.login('root', password);

      // a JWT payload is only base64, so a password in it is readable by anyone holding the token
      const { iat, exp, ...claims } = jwtService.decode(accessToken);
      expect(claims).toEqual({ username: 'root' });
    });

    it('rejects a wrong password', async () => {
      await expect(authService.login('root', 'nope')).rejects.toThrow(
        'Невірний пароль',
      );
    });

    it('rejects an unknown user', async () => {
      usersService.findOneByUsername.mockResolvedValue(undefined);

      await expect(authService.login('ghost', password)).rejects.toThrow(
        'Такого юзера не існує',
      );
    });
  });
});
