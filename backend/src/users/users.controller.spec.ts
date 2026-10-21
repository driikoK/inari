import { ForbiddenException } from '@nestjs/common';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { PollsService } from '../polls/polls.service.js';
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
  let pollsService: DeepMocked<PollsService>;
  let proposalsService: DeepMocked<ProposalsService>;
  let controller: UsersController;

  beforeEach(() => {
    usersService = createMock<UsersService>();
    pollsService = createMock<PollsService>();
    proposalsService = createMock<ProposalsService>();
    controller = new UsersController(
      usersService,
      pollsService,
      proposalsService,
    );
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

  describe('remove', () => {
    it("deletes the account, then the account's vote", async () => {
      usersService.delete.mockResolvedValue('ghost');

      await expect(controller.remove('m1', admin)).resolves.toBe(true);

      expect(usersService.delete).toHaveBeenCalledWith('m1', 'a1');
      expect(pollsService.deleteVotesByUser).toHaveBeenCalledWith('ghost');
      expect(proposalsService.deleteParticipationsByUser).toHaveBeenCalledWith(
        'ghost',
      );
    });

    it('still removes the proposal paws when the vote cleanup fails, then reports the failure', async () => {
      usersService.delete.mockResolvedValue('ghost');
      pollsService.deleteVotesByUser.mockRejectedValue(new Error('db down'));

      await expect(controller.remove('m1', admin)).rejects.toThrow('db down');

      expect(proposalsService.deleteParticipationsByUser).toHaveBeenCalledWith(
        'ghost',
      );
    });

    it('still removes the vote when the paw cleanup fails', async () => {
      usersService.delete.mockResolvedValue('ghost');
      proposalsService.deleteParticipationsByUser.mockRejectedValue(
        new Error('db down'),
      );

      await expect(controller.remove('m1', admin)).rejects.toThrow('db down');

      expect(pollsService.deleteVotesByUser).toHaveBeenCalledWith('ghost');
    });

    it('keeps the vote when the account could not be deleted', async () => {
      usersService.delete.mockRejectedValue(new Error('refused'));

      await expect(controller.remove('m1', admin)).rejects.toThrow('refused');

      expect(pollsService.deleteVotesByUser).not.toHaveBeenCalled();
      expect(
        proposalsService.deleteParticipationsByUser,
      ).not.toHaveBeenCalled();
    });
  });
});
