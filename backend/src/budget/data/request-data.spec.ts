import type { z } from 'zod';
import { EXPENSE_KIND } from '../enums/index.js';
import { CreateRequestData, FulfilRequestData } from './index.js';
import { CARD_LENGTH_MESSAGE, CARD_SUM_MESSAGE } from './payout.data.js';

const messagesOf = (schema: z.ZodType, input: unknown) => {
  const result = schema.safeParse(input);

  return result.success
    ? []
    : result.error.issues.map(({ message }) => message);
};

const CARD = '4111 1111 1111 1111';
const LINK = 'https://send.monobank.ua/jar/abc';

const card = { kind: EXPENSE_KIND.CARD, crumbs: 40, requisite: CARD };
const ask = (lines: object[], extra: object = {}) => ({
  isOrder: false,
  lines,
  ...extra,
});

describe('CreateRequestData', () => {
  it('takes the three sections together with one comment', () => {
    const result = CreateRequestData.safeParse(
      ask(
        [
          card,
          { kind: EXPENSE_KIND.DONATION, crumbs: 10.5, requisite: LINK },
          { kind: EXPENSE_KIND.DEVELOPMENT, crumbs: 3 },
        ],
        { comment: '  Дякую  ' },
      ),
    );

    expect(result.success).toBe(true);
    expect(result.data?.comment).toBe('Дякую');
  });

  it('wants at least one section and each kind once', () => {
    expect(messagesOf(CreateRequestData, ask([]))).toContain(
      'Заповніть хоча б один розділ',
    );
    expect(messagesOf(CreateRequestData, ask([card, card]))).toContain(
      'Розділ вказано двічі',
    );
  });

  it.each([
    [0, 'Кількість крихт має бути більшою за нуль'],
    [-3, 'Кількість крихт має бути більшою за нуль'],
    [1.2345, 'Не більше трьох знаків після коми'],
    [1_000_001, 'Забагато для одного запиту'],
  ])('refuses %s crumbs', (crumbs, message) => {
    expect(messagesOf(CreateRequestData, ask([{ ...card, crumbs }]))).toContain(
      message,
    );
  });

  it('wants the crumbs in a request for crumbs, and no hryvnias', () => {
    expect(
      messagesOf(CreateRequestData, ask([{ ...card, crumbs: undefined }])),
    ).toContain('Вкажіть кількість крихт');
    expect(
      messagesOf(CreateRequestData, ask([{ ...card, amountKop: 500 }])),
    ).toContain('Запит на крихти рахується в крихтах');
  });

  it('checks the card as a payout does, and refuses a masked one that nobody entered', () => {
    expect(
      messagesOf(
        CreateRequestData,
        ask([{ ...card, requisite: '4111 1111 1111 1112' }]),
      ),
    ).toContain(CARD_SUM_MESSAGE);
    expect(
      messagesOf(
        CreateRequestData,
        ask([{ ...card, requisite: '4111 1111 1111' }]),
      ),
    ).toContain(CARD_LENGTH_MESSAGE);
    expect(
      messagesOf(CreateRequestData, ask([{ ...card, requisite: '•••• 1111' }])),
    ).not.toEqual([]);
    expect(
      messagesOf(CreateRequestData, ask([{ ...card, requisite: '' }])),
    ).toContain('Вкажіть номер карти');
  });

  it('takes a card or a secure link for a donation, and nothing for a gift to the team', () => {
    const donation = { kind: EXPENSE_KIND.DONATION, crumbs: 5 };

    expect(
      messagesOf(CreateRequestData, ask([{ ...donation, requisite: LINK }])),
    ).toEqual([]);
    expect(
      messagesOf(CreateRequestData, ask([{ ...donation, requisite: CARD }])),
    ).toEqual([]);
    expect(
      messagesOf(
        CreateRequestData,
        ask([{ ...donation, requisite: 'http://x.ua' }]),
      ),
    ).not.toEqual([]);
    expect(
      messagesOf(
        CreateRequestData,
        ask([{ kind: EXPENSE_KIND.DEVELOPMENT, crumbs: 5 }]),
      ),
    ).toEqual([]);
  });

  it('does not keep a whole card number in the comment or the link', () => {
    expect(
      messagesOf(CreateRequestData, ask([card], { comment: `на ${CARD}` })),
    ).toContain('Не вказуйте номер карти в цьому полі');
    expect(
      messagesOf(
        CreateRequestData,
        ask([
          {
            kind: EXPENSE_KIND.DONATION,
            crumbs: 5,
            requisite: 'https://pay.example/4111111111111111',
          },
        ]),
      ),
    ).toContain('Посилання не має містити номер карти');
  });

  describe('for an order', () => {
    const order = (extra: object = {}, line: object = {}) => ({
      isOrder: true,
      projectId: 'p1',
      lines: [
        { kind: EXPENSE_KIND.CARD, amountKop: 50000, requisite: CARD, ...line },
      ],
      ...extra,
    });

    it('counts hryvnias and wants a title', () => {
      expect(messagesOf(CreateRequestData, order())).toEqual([]);
      expect(
        messagesOf(CreateRequestData, order({ projectId: undefined })),
      ).toContain('Оберіть тайтл замовлення');
      expect(
        messagesOf(
          CreateRequestData,
          order({ projectId: undefined, title: 'Вітробой' }),
        ),
      ).toEqual([]);
    });

    it('does not mix the crumbs in', () => {
      expect(
        messagesOf(CreateRequestData, order({}, { amountKop: undefined })),
      ).toContain('Вкажіть суму');
      expect(messagesOf(CreateRequestData, order({}, { crumbs: 5 }))).toContain(
        'Запит на замовлення рахується в гривнях',
      );
    });

    it.each([0, -1, 10.5, 1_000_000_001])('refuses %s kop', (amountKop) => {
      expect(
        messagesOf(CreateRequestData, order({}, { amountKop })),
      ).not.toEqual([]);
    });
  });
});

describe('FulfilRequestData', () => {
  it('takes no body for crumbs and a corrected sum for an order', () => {
    expect(messagesOf(FulfilRequestData, {})).toEqual([]);
    expect(messagesOf(FulfilRequestData, { amountKop: 4000 })).toEqual([]);
    expect(messagesOf(FulfilRequestData, { amountKop: 0 })).not.toEqual([]);
    expect(messagesOf(FulfilRequestData, { amountKop: 1.5 })).not.toEqual([]);
  });
});
