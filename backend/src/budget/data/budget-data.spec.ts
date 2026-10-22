import type { z } from 'zod';
import { SEASON } from '../../shared/index.js';
import { AUDIT_KIND, INCOME_SOURCE } from '../enums/index.js';
import {
  AuditQueryData,
  CreateIncomesData,
  EntriesQueryData,
  UpdateIncomeData,
} from './index.js';

const messagesOf = (schema: z.ZodType, input: unknown) => {
  const result = schema.safeParse(input);

  return result.success
    ? []
    : result.error.issues.map(({ message }) => message);
};

const period = { date: '2027-05-10', season: SEASON.SPRING, year: 2027 };
const line = { source: INCOME_SOURCE.TEAM_JAR, amountKop: 150000 };

describe('CreateIncomesData', () => {
  it('accepts a few lines with one date and season', () => {
    expect(
      messagesOf(CreateIncomesData, {
        ...period,
        lines: [line, { source: INCOME_SOURCE.BMAC, amountKop: 100 }],
      }),
    ).toEqual([]);
  });

  it('wants at least one line and not too many', () => {
    expect(messagesOf(CreateIncomesData, { ...period, lines: [] })).toContain(
      'Додайте хоча б одне надходження',
    );
    expect(
      messagesOf(CreateIncomesData, {
        ...period,
        lines: Array.from({ length: 21 }, () => line),
      }),
    ).toContain('Забагато надходжень за раз');
  });

  it.each([
    [0, 'Сума має бути більшою за нуль'],
    [-5, 'Сума має бути більшою за нуль'],
    [10.5, 'Сума має бути в копійках, цілим числом'],
    [1_000_000_001, 'Забагато для одного надходження'],
  ])('refuses %s kop', (amountKop, message) => {
    expect(
      messagesOf(CreateIncomesData, {
        ...period,
        lines: [{ ...line, amountKop }],
      }),
    ).toContain(message);
  });

  it('wants a title for an order, from the projects or typed', () => {
    const order = { source: INCOME_SOURCE.ORDER, amountKop: 100 };

    expect(
      messagesOf(CreateIncomesData, { ...period, lines: [order] }),
    ).toContain('Вкажіть назву тайтлу замовлення');
    expect(
      messagesOf(CreateIncomesData, {
        ...period,
        lines: [{ ...order, title: '   ' }],
      }),
    ).toContain('Вкажіть назву тайтлу замовлення');
    expect(
      messagesOf(CreateIncomesData, {
        ...period,
        lines: [{ ...order, title: 'Вітробой' }],
      }),
    ).toEqual([]);
    expect(
      messagesOf(CreateIncomesData, {
        ...period,
        lines: [{ ...order, projectId: 'p1' }],
      }),
    ).toEqual([]);
  });

  it('does not want a title for a project jar or a name for a lisodar', () => {
    expect(
      messagesOf(CreateIncomesData, {
        ...period,
        lines: [
          { source: INCOME_SOURCE.PROJECT_JAR, amountKop: 100 },
          { source: INCOME_SOURCE.LISODAR, amountKop: 100 },
        ],
      }),
    ).toEqual([]);
  });

  it('refuses an unknown source, a bad date and a year out of range', () => {
    expect(
      messagesOf(CreateIncomesData, {
        ...period,
        lines: [{ ...line, source: 'paypal' }],
      }),
    ).toContain('Оберіть джерело');
    expect(
      messagesOf(CreateIncomesData, {
        ...period,
        date: '10.05.2027',
        lines: [line],
      }),
    ).toContain('Вкажіть коректну дату');
    expect(
      messagesOf(CreateIncomesData, {
        ...period,
        date: '1999-12-31',
        lines: [line],
      }),
    ).toContain('Дата не може бути раніше 2000 року');
    expect(
      messagesOf(CreateIncomesData, { ...period, year: 1999, lines: [line] }),
    ).toContain('Рік не може бути раніше 2000');
  });

  it('trims the typed text and drops keys it does not know', () => {
    expect(
      CreateIncomesData.parse({
        ...period,
        isAdmin: true,
        lines: [
          {
            ...line,
            source: INCOME_SOURCE.LISODAR,
            nickname: '  Аня ',
            createdBy: 'somebody else',
          },
        ],
      }),
    ).toEqual({
      ...period,
      lines: [
        { source: INCOME_SOURCE.LISODAR, amountKop: 150000, nickname: 'Аня' },
      ],
    });
  });
});

describe('UpdateIncomeData', () => {
  it('is one line with its date and season', () => {
    expect(messagesOf(UpdateIncomeData, { ...period, ...line })).toEqual([]);
  });

  it('wants a title for an order too', () => {
    expect(
      messagesOf(UpdateIncomeData, {
        ...period,
        source: INCOME_SOURCE.ORDER,
        amountKop: 100,
      }),
    ).toContain('Вкажіть назву тайтлу замовлення');
  });
});

describe('EntriesQueryData', () => {
  it('pages from the first page by default', () => {
    expect(EntriesQueryData.parse({})).toEqual({ page: 1, perPage: 25 });
  });

  it('turns the query strings into numbers', () => {
    expect(
      EntriesQueryData.parse({
        page: '2',
        perPage: '50',
        season: 'spring',
        year: '2027',
      }),
    ).toEqual({ page: 2, perPage: 50, season: 'spring', year: 2027 });
  });

  it('wants the season and the year together and a sane page size', () => {
    expect(messagesOf(EntriesQueryData, { season: 'spring' })).toContain(
      'Сезон і рік вказуються разом',
    );
    expect(messagesOf(EntriesQueryData, { year: '2027' })).toContain(
      'Сезон і рік вказуються разом',
    );
    expect(messagesOf(EntriesQueryData, { perPage: '1000' })).not.toEqual([]);
    expect(messagesOf(EntriesQueryData, { page: '0' })).not.toEqual([]);
  });
});

describe('AuditQueryData', () => {
  it('pages by twenty operations by default', () => {
    expect(AuditQueryData.parse({})).toEqual({ page: 1, perPage: 20 });
  });

  it('takes the filters of the audit tab', () => {
    expect(
      AuditQueryData.parse({
        from: '2027-05-01',
        to: '2027-05-31',
        kind: AUDIT_KIND.INCOME_UPDATED,
        search: '  Аня ',
      }),
    ).toMatchObject({
      from: '2027-05-01',
      to: '2027-05-31',
      kind: AUDIT_KIND.INCOME_UPDATED,
      search: 'Аня',
    });
  });

  it('refuses an unknown kind, a bad day and too long a search', () => {
    expect(messagesOf(AuditQueryData, { kind: 'income.exploded' })).not.toEqual(
      [],
    );
    expect(messagesOf(AuditQueryData, { from: 'yesterday' })).not.toEqual([]);
    expect(messagesOf(AuditQueryData, { search: 'x'.repeat(101) })).not.toEqual(
      [],
    );
    expect(messagesOf(AuditQueryData, { perPage: '51' })).not.toEqual([]);
  });
});
