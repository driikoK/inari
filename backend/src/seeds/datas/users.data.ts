import { CreateUserDto } from '@users/interfaces/user.interface';
import { ROLE } from '@users/enums';

export const users: Omit<CreateUserDto, 'password'>[] = [
  {
    username: 'demo_director',
    email: 'demo_director@inari.local',
    role: ROLE.DIRECTOR,
  },
  {
    username: 'demo_member_1',
    email: 'demo_member_1@inari.local',
    role: ROLE.MEMBER,
  },
  {
    username: 'demo_member_2',
    email: 'demo_member_2@inari.local',
    role: ROLE.MEMBER,
  },
];
