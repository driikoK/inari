import { ROLE } from '@/context/casl';

export const userRoleOptions = [
  {
    label: 'Адмін',
    value: ROLE.ADMIN,
  },
  {
    label: 'Куратор',
    value: ROLE.DIRECTOR,
  },
  {
    label: 'Учасник',
    value: ROLE.MEMBER,
  },
];
