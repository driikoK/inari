export interface IUser {
  username: string;
  password: string;
  role: string;
}

export interface ValidatedUser extends Omit<IUser, 'password'> {}
