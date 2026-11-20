import { ROLE } from '@/context/casl';
import type { MemberKind } from '@/types';

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

export const memberKindOptions: { label: string; value: MemberKind }[] = [
  { label: 'Учасник команди', value: 'team' },
  { label: 'Гість', value: 'guest' },
];

export const UNMARKED_KIND_LABEL = 'Не вказано';

export const seasonOptions = [
  { label: 'Зима', value: 'winter' },
  { label: 'Весна', value: 'spring' },
  { label: 'Літо', value: 'summer' },
  { label: 'Осінь', value: 'fall' },
];

// The year of the first season of the team that has data, where the list of seasons starts
export const FIRST_SEASON_YEAR = 2024;

export const MAX_BULK_DELETE = 100;

export const MAX_POSTER_BYTES = 5 * 1024 * 1024;

export const POSTER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
