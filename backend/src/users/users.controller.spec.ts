import { ForbiddenException } from '@nestjs/common';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { ProposalsService } from '../proposals/proposals.service.js';
import { ROLE } from './enums/index.js';
import type { ValidatedUser } from './interfaces/user.interface.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

describe('UsersController', () => {
  const admin = {
    _id: 'a1',
    username: 'boss',
    role: ROLE.ADMIN,
  } as ValidatedUser;
  const member = {
    _id: 'm1',
    username: 'ghost',
    role: ROLE.MEMBER,
  } as ValidatedUser;

  let usersService: DeepMocked<UsersService>;
  let proposalsService: DeepMocked<ProposalsService>;
  let controller: UsersController;

  beforeEach(() => {
    usersService = createMock<UsersService>();
    proposalsService = createMock<ProposalsService>();
    controller = new UsersController(usersService, proposalsService);
  });

  describe('update', () => {
    it('lets an admin edit anyone, roles included', async () => {
      await controller.update('m1', { role: ROLE.DIRECTOR }, admin);

      expect(usersService.update).toHaveBeenCalledWith('m1', {
        role: ROLE.DIRECTOR,
      });
    });

    it('lets a member change their own email, sending their unchanged role along (the Profile page does)', async () => {
      await controller.update(
        'm1',
        { role: ROLE.MEMBER, email: 'new@mail.co' },
        member,
      );

      expect(usersService.update).toHaveBeenCalledWith('m1', {
        role: ROLE.MEMBER,
        email: 'new@mail.co',
      });
    });

    it('does not let a member promote themselves', () => {
      expect(() =>
        controller.update('m1', { role: ROLE.ADMIN }, member),
      ).toThrow(ForbiddenException);
      expect(usersService.update).not.toHaveBeenCalled();
    });

    it("does not let a member edit somebody else's account", () => {
      expect(() =>
        controller.update('someone-else', { email: 'x@mail.co' }, member),
      ).toThrow(ForbiddenException);
      expect(usersService.update).not.toHaveBeenCalled();
    });
  });

  describe('setNickname', () => {
    it('is for admins only', () => {
      expect(
        Reflect.getMetadata(
          '__guards__',
          UsersController.prototype.setNickname,
        ),
      ).toEqual([AuthGuard, AdminGuard]);
    });

    it('hands the choice to the service, with the admin who made it', async () => {
      await controller.setNickname(
        'm1',
        { nickname: 'Dixy', create: true },
        admin,
      );

      expect(usersService.setNickname).toHaveBeenCalledWith(
        'm1',
        { nickname: 'Dixy', create: true },
        admin.username,
      );
    });
  });

  describe('remove', () => {
    it("deletes the account, then the account's paws in open seasons", async () => {
      usersService.delete.mockResolvedValue('ghost');

      await expect(controller.remove('m1', admin)).resolves.toBe(true);

      expect(usersService.delete).toHaveBeenCalledWith('m1', 'a1');
      expect(proposalsService.deleteParticipationsByUser).toHaveBeenCalledWith(
        'ghost',
      );
    });

    it('reports the failure when the paw cleanup fails', async () => {
      usersService.delete.mockResolvedValue('ghost');
      proposalsService.deleteParticipationsByUser.mockRejectedValue(
        new Error('db down'),
      );

      await expect(controller.remove('m1', admin)).rejects.toThrow('db down');
    });

    it('keeps the paws when the account could not be deleted', async () => {
      usersService.delete.mockRejectedValue(new Error('refused'));

      await expect(controller.remove('m1', admin)).rejects.toThrow('refused');

      expect(
        proposalsService.deleteParticipationsByUser,
      ).not.toHaveBeenCalled();
    });
  });
});
