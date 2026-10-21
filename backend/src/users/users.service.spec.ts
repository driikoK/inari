import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Model } from 'mongoose';
import { vi } from 'vitest';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';

import { IUser } from './interfaces/user.interface.js';
import { UsersService } from './users.service.js';

describe('UsersService', () => {
  const id = '61c0ccf11d7bf83d153d7c06';
  const adminId = '61c0ccf11d7bf83d153d7c99';

  let service: UsersService;
  let model: DeepMocked<Model<IUser>>;

  const found = (user: Partial<IUser> | null) =>
    model.findById.mockReturnValue({
      exec: vi.fn().mockResolvedValue(user),
    } as any);

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: 'USER_MODEL', useValue: createMock<Model<IUser>>() },
      ],
    }).compile();

    service = module.get(UsersService);
    model = module.get('USER_MODEL');
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
