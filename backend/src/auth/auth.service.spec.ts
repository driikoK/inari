import { HttpException, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';
import bcrypt from 'bcrypt';

import { EmailService } from '../email/email.service.js';
import { ROLE } from '../users/enums/index.js';
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

  describe('signUp', () => {
    const data = { username: 'dixy', password, email: 'dixy@example.com' };

    beforeEach(() => {
      usersService.findOneByUsername.mockResolvedValue(null as never);
      usersService.create.mockResolvedValue('Created');
    });

    it('waits for the account to be saved before it answers', async () => {
      let saved = false;

      usersService.create.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        saved = true;

        return 'Created';
      });

      await expect(authService.signUp(data)).resolves.toBe(true);
      expect(saved).toBe(true);
    });

    it('makes a member of anybody but root, and an admin of root', async () => {
      await authService.signUp(data);
      await authService.signUp({ ...data, username: 'root' });

      expect(usersService.create).toHaveBeenNthCalledWith(1, {
        ...data,
        role: ROLE.MEMBER,
      });
      expect(usersService.create).toHaveBeenNthCalledWith(2, {
        ...data,
        username: 'root',
        role: ROLE.ADMIN,
      });
    });

    it('answers with the error when the account cannot be saved, instead of saying it was', async () => {
      usersService.create.mockRejectedValue(new Error('db down'));

      await expect(authService.signUp(data)).rejects.toThrow('db down');
    });

    it('answers 409 when the name is taken, and saves nothing', async () => {
      usersService.findOneByUsername.mockResolvedValue({
        username: 'dixy',
      } as never);

      await expect(authService.signUp(data)).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
      });
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('passes on the 409 of a parallel sign-up of the same name', async () => {
      usersService.create.mockRejectedValue(
        new HttpException('Такий нікнейм вже існує', HttpStatus.CONFLICT),
      );

      await expect(authService.signUp(data)).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
      });
    });
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
