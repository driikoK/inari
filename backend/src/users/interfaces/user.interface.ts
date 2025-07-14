import { ROLE } from '@users/enums';

export interface IUser {
  username: string;
  password: string;
  role: string;
  email?: string;
  _id: string;
}

export interface CreateUserDto extends Omit<IUser, '_id' | 'email' | 'role'> {
  email: string;
  role: ROLE;
}
export interface ValidatedUser extends Omit<IUser, 'password'> {}
