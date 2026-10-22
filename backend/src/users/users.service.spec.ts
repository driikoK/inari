import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Model } from 'mongoose';
import { vi } from 'vitest';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { IMember } from '../members/interfaces/members.interface.js';
import { MembersService } from '../members/members.service.js';
import { MEMBER_KIND } from '../shared/index.js';
import { IUser } from './interfaces/user.interface.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  const id = '61c0ccf11d7bf83d153d7c06';
  const adminId = '61c0ccf11d7bf83d153d7c99';

  let service: UsersService;
  let model: DeepMocked<Model<IUser>>;
  let membersService: DeepMocked<MembersService>;

  const found = (user: Partial<IUser> | null) =>
    model.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(user),
    } as any);

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: 'USER_MODEL', useValue: createMock<Model<IUser>>() },
        { provide: MembersService, useValue: createMock<MembersService>() },
      ],
    }).compile();

    service = module.get(UsersService);
    model = module.get('USER_MODEL');
    membersService = module.get(MembersService);
  });

  describe('setNickname', () => {
    const user = { _id: id, username: 'ghost' };
    const visible = { nickname: 'Dixy' } as IMember;
    const hidden = { nickname: 'Dixy', deletedAt: new Date() } as IMember;

    beforeEach(() => {
      found(user);
      model.exists.mockResolvedValue(null);
      model.findByIdAndUpdate.mockResolvedValue({ ...user } as any);
    });

    it('links a visible nickname to the account', async () => {
      membersService.findByNickname.mockResolvedValue(visible);

      await service.setNickname(id, { nickname: 'Dixy', create: false });

      expect(model.exists).toHaveBeenCalledWith({
        nickname: 'Dixy',
        _id: { $ne: id },
      });
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { $set: { nickname: 'Dixy' } },
        { new: true, select: '-password -__v' },
      );
      expect(membersService.createMember).not.toHaveBeenCalled();
    });

    it('unlinks the nickname when none is sent', async () => {
      await service.setNickname(id, { nickname: null, create: false });

      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { $unset: { nickname: 1 } },
        { new: true, select: '-password -__v' },
      );
      expect(membersService.findByNickname).not.toHaveBeenCalled();
    });

    it('refuses a nickname that belongs to another account', async () => {
      membersService.findByNickname.mockResolvedValue(visible);
      model.exists.mockResolvedValue({ _id: 'other' } as any);

      await expect(
        service.setNickname(id, { nickname: 'Dixy', create: false }),
      ).rejects.toMatchObject({ status: HttpStatus.CONFLICT });
      expect(model.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('refuses a hidden nickname and does not bring it back', async () => {
      membersService.findByNickname.mockResolvedValue(hidden);

      await expect(
        service.setNickname(id, { nickname: 'Dixy', create: true }),
      ).rejects.toMatchObject({ status: HttpStatus.CONFLICT });
      expect(membersService.createMember).not.toHaveBeenCalled();
      expect(model.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('reports an unknown nickname when creating was not asked for', async () => {
      membersService.findByNickname.mockResolvedValue(null);

      await expect(
        service.setNickname(id, { nickname: 'New', create: false }),
      ).rejects.toThrow('Нікнейм не знайдено');
      expect(membersService.createMember).not.toHaveBeenCalled();
    });

    it('creates an unknown nickname as a team member without roles, then links it', async () => {
      membersService.findByNickname.mockResolvedValue(null);

      await service.setNickname(id, { nickname: 'New', create: true });

      expect(membersService.createMember).toHaveBeenCalledWith({
        nickname: 'New',
        types: [],
        kind: MEMBER_KIND.TEAM,
      });
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        id,
        { $set: { nickname: 'New' } },
        expect.anything(),
      );
    });

    it('does not create a nickname that another account already holds', async () => {
      membersService.findByNickname.mockResolvedValue(null);
      model.exists.mockResolvedValue({ _id: 'other' } as any);

      await expect(
        service.setNickname(id, { nickname: 'New', create: true }),
      ).rejects.toMatchObject({ status: HttpStatus.CONFLICT });
      expect(membersService.createMember).not.toHaveBeenCalled();
    });

    it('turns the unique index refusal of a parallel request into the same conflict', async () => {
      membersService.findByNickname.mockResolvedValue(visible);
      model.findByIdAndUpdate.mockRejectedValue({ code: 11000 });

      await expect(
        service.setNickname(id, { nickname: 'Dixy', create: false }),
      ).rejects.toMatchObject({ status: HttpStatus.CONFLICT });
    });

    it('never edits root', async () => {
      found({ _id: id, username: 'root' });

      await expect(
        service.setNickname(id, { nickname: 'Dixy', create: false }),
      ).rejects.toMatchObject({ status: HttpStatus.CONFLICT });
      expect(model.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('reports an unknown account', async () => {
      found(null);

      await expect(
        service.setNickname(id, { nickname: 'Dixy', create: false }),
      ).rejects.toThrow('Юзера не знайдено');
    });

    it('rejects an id that is not an ObjectId without touching the database', async () => {
      await expect(
        service.setNickname('nope', { nickname: 'Dixy', create: false }),
      ).rejects.toThrow('Невірний id');

      expect(model.findById).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('removes the account and returns its username', async () => {
      found({ _id: id, username: 'ghost' });

      await expect(service.delete(id, adminId)).resolves.toBe('ghost');

      expect(model.deleteOne).toHaveBeenCalledWith({ _id: id });
    });

    it('reports an unknown user', async () => {
      found(null);

      await expect(service.delete(id, adminId)).rejects.toThrow(
        'Юзера не знайдено',
      );
      expect(model.deleteOne).not.toHaveBeenCalled();
    });

    it('never removes root', async () => {
      found({ _id: id, username: 'root' });

      await expect(service.delete(id, adminId)).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
      });
      expect(model.deleteOne).not.toHaveBeenCalled();
    });

    it('does not let an admin remove their own account', async () => {
      found({ _id: adminId, username: 'admin' });

      await expect(service.delete(adminId, adminId)).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
      });
      expect(model.deleteOne).not.toHaveBeenCalled();
    });

    it('rejects an id that is not an ObjectId without touching the database', async () => {
      await expect(service.delete('nope', adminId)).rejects.toThrow(
        'Невірний id',
      );

      expect(model.findById).not.toHaveBeenCalled();
    });
  });
});
