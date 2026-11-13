import type { z } from 'zod';
import { SEASON } from '../../shared/index.js';
import {
  ENTRY_TYPE,
  EXPENSE_KIND,
  EXPENSE_SECTION,
  SUPPORT_DIRECTION,
} from '../enums/index.js';
import {
  CreateExpensesData,
  EntriesQueryData,
  UpdateExpenseData,
  UpdateSupportData,
} from './index.js';
import { CARD_LENGTH_MESSAGE, CARD_SUM_MESSAGE } from './payout.data.js';

const messagesOf = (schema: z.ZodType, input: unknown) => {
  const result = schema.safeParse(input);

  return result.success
    ? []
    : result.error.issues.map(({ message }) => message);
};

const CARD = '4111 1111 1111 1111';
const LINK = 'https://send.monobank.ua/jar/abc';

const card = {
  kind: EXPENSE_KIND.CARD,
  amountKop: 50000,
  section: EXPENSE_SECTION.SUPPORT,
  direction: SUPPORT_DIRECTION.SERVER,
  nickname: 'Аня',
  requisite: CARD,
};

const create = (lines: object[], extra: object = {}) => ({
  date: '2027-05-10',
  lines,
  ...extra,
});

describe('CreateExpensesData', () => {
  it('accepts the three kinds of payout together with one comment', () => {
    const result = CreateExpensesData.safeParse(
      create(
        [
          card,
          { ...card, kind: EXPENSE_KIND.DONATION, requisite: LINK },
          {
            kind: EXPENSE_KIND.DEVELOPMENT,
            amountKop: 100,
            section: EXPENSE_SECTION.ORDERS,
            title: 'Вітробой',
            nickname: 'Аня',
          },
        ],
        { comment: '  Дякуємо  ' },
      ),
    );

    expect(result.success).toBe(true);
    expect(result.data?.comment).toBe('Дякуємо');
  });

  it('does not take a payout of crumbs, which only a request writes', () => {
    expect(
      messagesOf(
        CreateExpensesData,
        create([{ ...card, section: EXPENSE_SECTION.CRUMBS }]),
      ),
    ).toContain('Оберіть розділ бюджету');
    expect(
      messagesOf(UpdateExpenseData, {
        ...card,
        date: '2027-05-10',
        section: EXPENSE_SECTION.CRUMBS,
      }),
    ).toContain('Оберіть розділ бюджету');
  });

  it('wants at least one line and not too many', () => {
    expect(messagesOf(CreateExpensesData, create([]))).toContain(
      'Заповніть хоча б один розділ',
    );
    expect(
      messagesOf(
        CreateExpensesData,
        create(Array.from({ length: 21 }, () => card)),
      ),
    ).toContain('Забагато видатків за раз');
  });

  it.each([
    [0, 'Сума має бути більшою за нуль'],
    [-5, 'Сума має бути більшою за нуль'],
    [10.5, 'Сума має бути в копійках, цілим числом'],
    [1_000_000_001, 'Забагато для одного видатку'],
  ])('refuses %s kop', (amountKop, message) => {
    expect(
      messagesOf(CreateExpensesData, create([{ ...card, amountKop }])),
    ).toContain(message);
  });

  it('wants a name for every payout', () => {
    expect(
      messagesOf(CreateExpensesData, create([{ ...card, nickname: '  ' }])),
    ).toContain('Вкажіть ім’я учасника');
  });

  it('wants a direction for the support budget and a title for the orders', () => {
    expect(
      messagesOf(
        CreateExpensesData,
        create([{ ...card, direction: undefined }]),
      ),
    ).toContain('Оберіть напрямок підтримки');
    expect(
      messagesOf(
        CreateExpensesData,
        create([
          { ...card, section: EXPENSE_SECTION.ORDERS, direction: undefined },
        ]),
      ),
    ).toContain('Вкажіть тайтл замовлення');
    expect(
      messagesOf(
        CreateExpensesData,
        create([
          {
            ...card,
            section: EXPENSE_SECTION.ORDERS,
            direction: undefined,
            projectId: 'p1',
          },
        ]),
      ),
    ).toEqual([]);
  });

  describe('the requisite', () => {
    it('wants a real card number for a card, and says so when one digit is wrong', () => {
      expect(
        messagesOf(CreateExpensesData, create([{ ...card, requisite: '' }])),
      ).toContain('Вкажіть номер карти');
      expect(
        messagesOf(
          CreateExpensesData,
          create([{ ...card, requisite: '4111 1111 1111 1112' }]),
        ),
      ).toContain(CARD_SUM_MESSAGE);
      expect(
        messagesOf(CreateExpensesData, create([{ ...card, requisite: LINK }])),
      ).not.toEqual([]);
    });

    it('tells a number of 16 digits that does not add up from one of the wrong length', () => {
      const messages = (requisite: string, kind = EXPENSE_KIND.CARD) =>
        messagesOf(CreateExpensesData, create([{ ...card, kind, requisite }]));

      expect(messages('4444 1144 2314 2234')).toContain(CARD_SUM_MESSAGE);
      expect(messages('4444-1144-2314-2234')).toContain(CARD_SUM_MESSAGE);
      expect(messages('4444 1144 2314 2234')).not.toContain(
        CARD_LENGTH_MESSAGE,
      );
      expect(messages('4444 1144 2314')).toContain(CARD_LENGTH_MESSAGE);
      expect(messages('4444 1144 2314 2234 5')).toContain(CARD_LENGTH_MESSAGE);
      expect(messages('4444 1144 2314 22ab')).toContain(CARD_LENGTH_MESSAGE);
      expect(messages('4444 1144 2314 2234', EXPENSE_KIND.DONATION)).toContain(
        CARD_SUM_MESSAGE,
      );
      expect(messages('4444 4444 4444 4448')).toEqual([]);
    });

    it('takes a card or a secure link for a donation', () => {
      const donation = { ...card, kind: EXPENSE_KIND.DONATION };

      expect(
        messagesOf(
          CreateExpensesData,
          create([{ ...donation, requisite: LINK }]),
        ),
      ).toEqual([]);
      expect(
        messagesOf(
          CreateExpensesData,
          create([{ ...donation, requisite: CARD }]),
        ),
      ).toEqual([]);
      expect(
        messagesOf(
          CreateExpensesData,
          create([{ ...donation, requisite: 'http://example.com' }]),
        ),
      ).toContain(
        'Вкажіть номер карти або посилання, що починається з https://',
      );
      expect(
        messagesOf(
          CreateExpensesData,
          create([{ ...donation, requisite: undefined }]),
        ),
      ).toContain('Вкажіть номер карти або посилання на банку');
    });

    it('does not take a masked number for a new payout, as it was never checked', () => {
      expect(
        messagesOf(
          CreateExpensesData,
          create([{ ...card, requisite: '•••• 0000' }]),
        ),
      ).toContain('Номер карти — 16 цифр, перевірте, чи немає помилки');
      expect(
        messagesOf(
          CreateExpensesData,
          create([
            { ...card, kind: EXPENSE_KIND.DONATION, requisite: '•••• 0000' },
          ]),
        ),
      ).toContain(
        'Вкажіть номер карти або посилання, що починається з https://',
      );
    });

    it('does not take a link that carries a card number', () => {
      expect(
        messagesOf(
          CreateExpensesData,
          create([
            {
              ...card,
              kind: EXPENSE_KIND.DONATION,
              requisite: 'https://pay.example/4111111111111111',
            },
          ]),
        ),
      ).toContain('Посилання не має містити номер карти');
    });

    it('is not needed for the development of the team', () => {
      expect(
        messagesOf(
          CreateExpensesData,
          create([
            {
              ...card,
              kind: EXPENSE_KIND.DEVELOPMENT,
              requisite: undefined,
            },
          ]),
        ),
      ).toEqual([]);
    });
  });

  it.each(['comment', 'title', 'nickname'])(
    'does not keep a card number written in the %s',
    (field) => {
      const line = {
        ...card,
        section: EXPENSE_SECTION.ORDERS,
        direction: undefined,
      };
      const lines =
        field === 'comment'
          ? create([line], { comment: `на ${CARD}` })
          : create([{ ...line, title: 'Т', [field]: `на ${CARD}` }]);

      expect(messagesOf(CreateExpensesData, lines)).toContain(
        'Не вказуйте номер карти в цьому полі',
      );
    },
  );

  it('refuses a bad day', () => {
    expect(
      messagesOf(CreateExpensesData, { ...create([card]), date: '1999-12-31' }),
    ).toContain('Дата не може бути раніше 2000 року');
    expect(
      messagesOf(CreateExpensesData, { ...create([card]), date: 'yesterday' }),
    ).toContain('Вкажіть коректну дату');
  });
});

describe('UpdateExpenseData', () => {
  it('takes one expense, whose number may come back as it was masked', () => {
    expect(
      messagesOf(UpdateExpenseData, {
        ...card,
        date: '2027-05-10',
        requisite: '•••• 1111',
        comment: 'Дякуємо',
      }),
    ).toEqual([]);
  });

  it('still refuses a card number in the comment of an edit', () => {
    expect(
      messagesOf(UpdateExpenseData, {
        ...card,
        date: '2027-05-10',
        requisite: '•••• 1111',
        comment: CARD,
      }),
    ).toContain('Не вказуйте номер карти в цьому полі');
  });

  it('checks the same things as a new one', () => {
    expect(
      messagesOf(UpdateExpenseData, {
        ...card,
        date: '2027-05-10',
        direction: undefined,
      }),
    ).toContain('Оберіть напрямок підтримки');
  });
});

describe('UpdateSupportData', () => {
  const when = { date: '2027-05-10', season: SEASON.SPRING, year: 2027 };

  it('takes the new budget of a few directions', () => {
    expect(
      messagesOf(UpdateSupportData, {
        ...when,
        targets: [
          { direction: SUPPORT_DIRECTION.SITE, targetKop: 150000 },
          { direction: SUPPORT_DIRECTION.BOTS, targetKop: 0 },
        ],
      }),
    ).toEqual([]);
  });

  it('refuses a negative budget, a fraction of a kopiyka and too much', () => {
    const one = (targetKop: number) =>
      messagesOf(UpdateSupportData, {
        ...when,
        targets: [{ direction: SUPPORT_DIRECTION.SITE, targetKop }],
      });

    expect(one(-1)).toContain('Бюджет напрямку не може бути від’ємним');
    expect(one(0.5)).toContain('Сума має бути в копійках, цілим числом');
    expect(one(1_000_000_001)).toContain('Забагато для одного напрямку');
  });

  it('wants a direction once and at least one of them', () => {
    expect(messagesOf(UpdateSupportData, { ...when, targets: [] })).toContain(
      'Вкажіть хоча б один напрямок',
    );
    expect(
      messagesOf(UpdateSupportData, {
        ...when,
        targets: [
          { direction: SUPPORT_DIRECTION.SITE, targetKop: 1 },
          { direction: SUPPORT_DIRECTION.SITE, targetKop: 2 },
        ],
      }),
    ).toContain('Напрямок вказано двічі');
  });

  it('refuses an unknown direction and a season that does not exist', () => {
    expect(
      messagesOf(UpdateSupportData, {
        ...when,
        targets: [{ direction: 'coffee', targetKop: 1 }],
      }),
    ).not.toEqual([]);
    expect(
      messagesOf(UpdateSupportData, {
        ...when,
        season: 'monsoon',
        targets: [{ direction: SUPPORT_DIRECTION.SITE, targetKop: 1 }],
      }),
    ).toContain('Оберіть сезон');
  });
});

describe('EntriesQueryData by type', () => {
  it('takes a kind of record to list', () => {
    expect(EntriesQueryData.parse({ type: ENTRY_TYPE.EXPENSE })).toMatchObject({
      type: ENTRY_TYPE.EXPENSE,
    });
    expect(messagesOf(EntriesQueryData, { type: 'gift' })).not.toEqual([]);
  });
});
