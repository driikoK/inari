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

export const UNMARKED_KIND = 'unmarked';
export const UNMARKED_KIND_LABEL = 'Не вказано';

export const seasonOptions = [
  { label: 'Зима', value: 'winter' },
  { label: 'Весна', value: 'spring' },
  { label: 'Літо', value: 'summer' },
  { label: 'Осінь', value: 'fall' },
];

export const yearOptions = [
  {
    label: '2024',
    value: '2024',
  },
  {
    label: '2025',
    value: '2025',
  },
  {
    label: '2026',
    value: '2026',
  },
  {
    label: '2027',
    value: '2027',
  },
];
