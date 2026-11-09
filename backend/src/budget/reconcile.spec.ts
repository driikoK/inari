import { SEASON } from '../shared/index.js';
import {
  AUDIT_KIND,
  AUDIT_UNIT,
  ENTRY_TYPE,
  EXPENSE_KIND,
  EXPENSE_SECTION,
  INCOME_SOURCE,
  RECONCILE_CHECK,
  RECONCILE_STATUS,
  REQUEST_STATUS,
  SIDE_KIND,
  SUPPORT_DIRECTION,
} from './enums/index.js';
import type {
  AllocationEntry,
  BudgetEntry,
  EntryGroup,
  ExpenseEntry,
  IncomeEntry,
  WithdrawalRequest,
} from './interfaces/index.js';
import {
  checkAuditMoney,
  checkConfectionery,
  checkCrumbsAudit,
  checkCrumbsNegative,
  checkCrumbsSum,
  checkCrumbsTracks,
  checkEntries,
  checkNegative,
  checkRequests,
  checkUnauditedEntries,
  type MemberCrumbs,
  reconcile,
  type ReconcileInput,
  sidesOf,
  unauditedNicknames,
} from './reconcile.js';

const { OK, WARNING, ERROR } = RECONCILE_STATUS;

const SPRING = SEASON.SPRING;
const WINTER = SEASON.WINTER;

const income = (extra: Partial<IncomeEntry> = {}): IncomeEntry => ({
  _id: 'i1',
  type: ENTRY_TYPE.INCOME,
  source: INCOME_SOURCE.TEAM_JAR,
  amountKop: 100000,
  date: '2027-05-10',
  season: SPRING,
  year: 2027,
  createdBy: 'root',
  ...extra,
});

const allocation = (extra: Partial<AllocationEntry> = {}): AllocationEntry => ({
  _id: 'a1',
  type: ENTRY_TYPE.ALLOCATION,
  direction: SUPPORT_DIRECTION.SITE,
  amountKop: 30000,
  date: '2027-05-10',
  season: SPRING,
  year: 2027,
  createdBy: 'root',
  ...extra,
});

const expense = (extra: Partial<ExpenseEntry> = {}): ExpenseEntry => ({
  _id: 'e1',
  type: ENTRY_TYPE.EXPENSE,
  kind: EXPENSE_KIND.CARD,
  section: EXPENSE_SECTION.SUPPORT,
  direction: SUPPORT_DIRECTION.SITE,
  amountKop: 10000,
  nickname: 'Аня',
  date: '2027-05-11',
  season: SPRING,
  year: 2027,
  createdBy: 'root',
  ...extra,
});

// 10 crumbs at 2,5 грн are 25,00
const payout = (extra: Partial<ExpenseEntry> = {}): ExpenseEntry =>
  expense({
    _id: 'p1',
    section: EXPENSE_SECTION.CRUMBS,
    direction: undefined,
    amountKop: 2500,
    crumbs: 10,
    coefficient: 2.5,
    crumbSeason: WINTER,
    crumbYear: 2027,
    requestId: 'r1',
    ...extra,
  });

const groups = (...entries: BudgetEntry[]): EntryGroup[] =>
  entries.map((entry) => ({ ...entry, count: 1 }) as EntryGroup);

const request = (
  extra: Partial<WithdrawalRequest> = {},
): WithdrawalRequest => ({
  _id: 'r1',
  status: REQUEST_STATUS.DONE,
  username: 'anya',
  nickname: 'Аня',
  groupId: 'g1',
  kind: EXPENSE_KIND.CARD,
  isOrder: false,
  crumbs: 10,
  paidKop: 2500,
  parts: [
    {
      season: WINTER,
      year: 2027,
      crumbs: 10,
      coefficient: 2.5,
      amountKop: 2500,
    },
  ],
  closedDay: '2027-10-05',
  ...extra,
});

const member = (extra: Partial<MemberCrumbs> = {}): MemberCrumbs => ({
  nickname: 'Аня',
  coins: 100,
  seasons: [{ season: SPRING, year: 2027, coins: 100 }],
  crumbsAuditedAt: new Date('2027-05-01'),
  ...extra,
});

const only = (check: { problems: unknown[] }) => check.problems[0] as any;

describe('sidesOf', () => {
  it('adds up what every side holds, counting equal records together', () => {
    const sides = sidesOf([
      { ...income(), count: 3 } as EntryGroup,
      ...groups(allocation()),
    ]);

    expect(sides.get('jar:2027-spring')).toMatchObject({
      kind: SIDE_KIND.JAR,
      kop: 300000 - 30000,
    });
    expect(sides.get('support:site')?.kop).toBe(30000);
  });
});

describe('checkConfectionery', () => {
  it('is whole when the sides add up to what came in minus what left', () => {
    const check = checkConfectionery(
      groups(income(), allocation(), expense({ amountKop: 10000 })),
    );

    expect(check.key).toBe(RECONCILE_CHECK.CONFECTIONERY);
    expect(check.status).toBe(OK);
    expect(check.problems).toEqual([]);
  });

  it('does not count what only moves inside the team as money that left', () => {
    const check = checkConfectionery(
      groups(
        income(),
        allocation(),
        expense({ kind: EXPENSE_KIND.DEVELOPMENT, amountKop: 10000 }),
      ),
    );

    expect(check.status).toBe(OK);
  });

  it('counts a payout of crumbs and an order the same way', () => {
    const check = checkConfectionery(
      groups(
        income({ source: INCOME_SOURCE.ORDER, title: 'Т' }),
        income({ _id: 'i2', amountKop: 50000, season: WINTER }),
        payout(),
      ),
    );

    expect(check.status).toBe(OK);
  });

  it('shows the difference when the sides do not add up', () => {
    const sides = new Map([
      [
        'jar:2027-spring',
        { kind: SIDE_KIND.JAR, label: 'Банка Весна 2027', kop: 99500 },
      ],
    ]);

    const check = checkConfectionery(groups(income()), sides);

    expect(check.status).toBe(ERROR);
    expect(only(check)).toMatchObject({
      subject: 'Кондитерська',
      unit: AUDIT_UNIT.MONEY,
      expected: 100000,
      actual: 99500,
      difference: -500,
    });
  });
});

describe('checkNegative', () => {
  it('is whole when nothing is below zero', () => {
    expect(checkNegative(groups(income(), allocation())).status).toBe(OK);
  });

  it('names every side that went below zero', () => {
    const check = checkNegative(groups(income(), expense({ amountKop: 700 })));

    expect(check.status).toBe(ERROR);
    expect(check.problems).toEqual([
      expect.objectContaining({
        subject: 'Підтримка: Сайт',
        expected: 0,
        actual: -700,
        difference: -700,
      }),
    ]);
  });
});

describe('checkAuditMoney', () => {
  const rows = [
    { key: 'jar:2027-spring', label: 'Банка Весна 2027', kop: 70000, rows: 1 },
    { key: 'support:site', label: 'Підтримка: Сайт', kop: 30000, rows: 1 },
  ];

  it('is whole when the rows of the audit give what the journal gives', () => {
    expect(checkAuditMoney(groups(income(), allocation()), rows).status).toBe(
      OK,
    );
  });

  it('names a side where they differ, with both numbers', () => {
    const check = checkAuditMoney(groups(income(), allocation()), [
      { ...rows[0], kop: 60000 },
      rows[1],
    ]);

    expect(check.status).toBe(ERROR);
    expect(only(check)).toMatchObject({
      subject: 'Банка Весна 2027',
      expected: 70000,
      actual: 60000,
      difference: -10000,
    });
  });

  it('finds a side the journal has and the audit has never met', () => {
    const check = checkAuditMoney(groups(income(), allocation()), [rows[0]]);

    expect(only(check)).toMatchObject({
      subject: 'Підтримка: Сайт',
      expected: 30000,
      actual: 0,
    });
  });

  it('finds a side only the audit has, as one the journal lost', () => {
    const check = checkAuditMoney(groups(income()), [
      {
        key: 'jar:2027-spring',
        label: 'Банка Весна 2027',
        kop: 100000,
        rows: 1,
      },
      { key: 'orders:title:x', label: 'Тістечка: Х', kop: 4000, rows: 1 },
    ]);

    expect(only(check)).toMatchObject({
      subject: 'Тістечка: Х',
      expected: 0,
      actual: 4000,
    });
  });

  it('is whole for a record and its removal, which add up to nothing', () => {
    expect(
      checkAuditMoney(groups(), [
        { key: 'jar:2027-spring', label: 'Банка', kop: 0, rows: 1 },
      ]).status,
    ).toBe(OK);
  });
});

describe('checkUnauditedEntries', () => {
  it('names a record with no row in the audit', () => {
    const check = checkUnauditedEntries(
      [income({ _id: 'i1' }), income({ _id: 'i2', amountKop: 5000 })],
      new Set(['i1']),
    );

    expect(check.status).toBe(ERROR);
    expect(check.problems).toHaveLength(1);
    expect(only(check).subject).toContain('50,00');
    expect(only(check).message).toContain('2027-05-10');
  });

  it('is whole when every record has a row', () => {
    expect(
      checkUnauditedEntries([income(), allocation()], new Set(['i1', 'a1']))
        .status,
    ).toBe(OK);
  });
});

describe('checkEntries', () => {
  it('is whole for sound records and a payout that adds up', () => {
    expect(checkEntries([income(), allocation(), payout()]).status).toBe(OK);
  });

  it('refuses an amount that is not a whole number of kopiykas', () => {
    const check = checkEntries([income({ amountKop: 100.5 })]);

    expect(only(check)).toMatchObject({
      actual: 100.5,
      message: expect.stringContaining('цілою'),
    });
  });

  it('names a payout of crumbs that is not crumbs times the coefficient', () => {
    const check = checkEntries([payout({ amountKop: 2600 })]);

    expect(only(check)).toMatchObject({
      expected: 2500,
      actual: 2600,
      difference: 100,
    });
  });

  it('names a payout of crumbs that has lost its crumbs or its season', () => {
    const check = checkEntries([
      payout({ crumbs: undefined }),
      payout({ _id: 'p2', crumbSeason: undefined }),
    ]);

    expect(check.problems).toHaveLength(2);
    expect(only(check).message).toContain('немає крихт');
  });
});

describe('checkRequests', () => {
  const logged = (crumbs: number, id = 'p1') =>
    new Map([[id, crumbs]]) as Map<string, number>;

  it('is whole for a request, its payout and the crumbs the audit took off', () => {
    const check = checkRequests([request()], [payout()], logged(-10));

    expect(check.status).toBe(OK);
  });

  it('is whole for a request that was not fulfilled, and has nothing', () => {
    expect(
      checkRequests(
        [request({ status: REQUEST_STATUS.OPEN, paidKop: undefined })],
        [],
        new Map(),
      ).status,
    ).toBe(OK);
  });

  it('names a fulfilled request that has no payouts', () => {
    const check = checkRequests([request()], [], new Map());

    expect(check.status).toBe(ERROR);
    expect(only(check)).toMatchObject({
      subject: expect.stringContaining('Аня'),
      expected: 2500,
      actual: 0,
    });
  });

  it('names payouts that add up to another sum than the request', () => {
    const check = checkRequests(
      [request({ paidKop: 3000 })],
      [payout()],
      logged(-10),
    );

    expect(only(check)).toMatchObject({ expected: 3000, actual: 2500 });
  });

  it('names crumbs of the payouts that differ from the crumbs of the request', () => {
    const check = checkRequests(
      [
        request({
          parts: [
            {
              season: WINTER,
              year: 2027,
              crumbs: 12,
              coefficient: 2.5,
              amountKop: 3000,
            },
          ],
        }),
      ],
      [payout()],
      logged(-10),
    );

    expect(check.problems).toEqual([
      expect.objectContaining({
        unit: AUDIT_UNIT.CRUMBS,
        expected: 12,
        actual: 10,
      }),
    ]);
  });

  it('names a payout whose crumbs the audit never took off', () => {
    const check = checkRequests([request()], [payout()], new Map());

    expect(only(check)).toMatchObject({
      unit: AUDIT_UNIT.CRUMBS,
      expected: -10,
      actual: 0,
      message: expect.stringContaining('немає рядка аудиту'),
    });
  });

  it('names a payout whose crumbs in the audit are another number', () => {
    const check = checkRequests([request()], [payout()], logged(-4));

    expect(only(check)).toMatchObject({ expected: -10, actual: -4 });
  });

  it('names a payout whose request is gone or was not fulfilled', () => {
    const check = checkRequests(
      [request({ _id: 'r2', status: REQUEST_STATUS.REJECTED })],
      [payout({ requestId: 'r2' }), payout({ _id: 'p2', requestId: 'r9' })],
      logged(-10),
    );

    expect(check.problems.map(({ message }) => message)).toEqual([
      expect.stringContaining('відхилений'),
      expect.stringContaining('якого немає'),
    ]);
  });

  it('does not ask crumbs of an order, which pays in hryvnias', () => {
    const order = expense({
      _id: 'o1',
      section: EXPENSE_SECTION.ORDERS,
      direction: undefined,
      title: 'Т',
      amountKop: 5000,
      requestId: 'r3',
    });
    const check = checkRequests(
      [request({ _id: 'r3', isOrder: true, paidKop: 5000, parts: undefined })],
      [order],
      new Map(),
    );

    expect(check.status).toBe(OK);
  });
});

describe('the checks of the crumbs of a nickname', () => {
  it('checkCrumbsSum warns when the total is not the sum of the seasons', () => {
    expect(checkCrumbsSum([member()]).status).toBe(OK);

    const check = checkCrumbsSum([member({ coins: 120 })]);

    expect(check.status).toBe(WARNING);
    expect(only(check)).toMatchObject({
      subject: 'Аня',
      expected: 100,
      actual: 120,
      difference: 20,
    });
  });

  it('checkCrumbsSum copes with a nickname that has no seasons at all', () => {
    expect(
      checkCrumbsSum([member({ coins: 0, seasons: undefined as never })])
        .status,
    ).toBe(OK);
  });

  it('checkCrumbsNegative names a total or a season below zero', () => {
    expect(checkCrumbsNegative([member()]).status).toBe(OK);

    const check = checkCrumbsNegative([
      member({
        coins: -5,
        seasons: [{ season: SPRING, year: 2027, coins: -5 }],
      }),
    ]);

    expect(check.status).toBe(ERROR);
    expect(check.problems).toHaveLength(2);
    expect(check.problems[1].subject).toContain('Весна 2027');
  });

  it('checkCrumbsNegative forgives the noise of fractions', () => {
    expect(
      checkCrumbsNegative([
        member({
          coins: -1e-15,
          seasons: [{ season: SPRING, year: 2027, coins: -1e-15 }],
        }),
      ]).status,
    ).toBe(OK);
  });

  describe('checkCrumbsAudit', () => {
    // the order of two names that differ only in case depends on the locale
    const BOTH = expect.stringMatching(/^(Anya \/ anya|anya \/ Anya)$/);

    const rows = (...crumbs: number[]) =>
      crumbs.map((value) => ({
        key: 'crumbs:аня',
        kind: AUDIT_KIND.TRACK_CREATED,
        crumbs: value,
        rows: 1,
      }));

    it('is whole when the rows add up to the balance', () => {
      expect(checkCrumbsAudit([member()], rows(60, 40)).status).toBe(OK);
    });

    it('names a nickname whose rows give another balance', () => {
      const check = checkCrumbsAudit([member()], rows(60, 30));

      expect(check.status).toBe(ERROR);
      expect(only(check)).toMatchObject({
        subject: 'Аня',
        expected: 90,
        actual: 100,
        difference: 10,
      });
    });

    it('warns of a nickname with crumbs that the audit has not met', () => {
      const check = checkCrumbsAudit(
        [member({ crumbsAuditedAt: undefined })],
        [],
      );

      expect(check.status).toBe(WARNING);
      expect(only(check)).toMatchObject({
        severity: WARNING,
        subject: 'Аня',
      });
    });

    it('leaves a nickname with no crumbs and no audit alone', () => {
      expect(
        checkCrumbsAudit(
          [member({ crumbsAuditedAt: undefined, coins: 0, seasons: [] })],
          [],
        ).status,
      ).toBe(OK);
    });

    it('names crumbs in the audit for a nickname that is not in the rating', () => {
      const check = checkCrumbsAudit(
        [],
        [
          {
            key: 'crumbs:привид',
            kind: AUDIT_KIND.TRACK_CREATED,
            crumbs: 5,
            rows: 1,
          },
        ],
      );

      expect(only(check)).toMatchObject({ subject: 'привид', actual: 5 });
    });

    it('forgives the rounding of the rows: each one is kept to a thousandth and the counter is not', () => {
      // a guest on a short film with all three multipliers earns 1,09375 a track
      const tens = [
        {
          key: 'crumbs:аня',
          kind: AUDIT_KIND.TRACK_CREATED,
          crumbs: 10.94,
          rows: 10,
        },
      ];

      expect(checkCrumbsAudit([member({ coins: 10.9375 })], tens).status).toBe(
        OK,
      );
      expect(
        checkCrumbsAudit(
          [member({ coins: 10.9375 })],
          [{ ...tens[0], rows: 1 }],
        ).status,
      ).toBe(ERROR);
    });

    it('still names a real gap, even with many rows', () => {
      const check = checkCrumbsAudit(
        [member({ coins: 11.5 })],
        [
          {
            key: 'crumbs:аня',
            kind: AUDIT_KIND.TRACK_CREATED,
            crumbs: 10.94,
            rows: 10,
          },
        ],
      );

      expect(check.status).toBe(ERROR);
      expect(only(check)).toMatchObject({ expected: 10.94, actual: 11.5 });
    });

    it('adds up nicknames that differ only in case, as the audit cannot tell them apart', () => {
      const pair = [
        member({ nickname: 'Anya', coins: 5 }),
        member({ nickname: 'anya', coins: 3 }),
      ];
      const audit = (crumbs: number) => [
        { key: 'crumbs:anya', kind: AUDIT_KIND.TRACK_CREATED, crumbs, rows: 2 },
      ];
      const whole = checkCrumbsAudit(pair, audit(8));

      expect(whole.status).toBe(WARNING);
      expect(whole.problems).toHaveLength(1);
      expect(only(whole)).toMatchObject({
        subject: BOTH,
        severity: WARNING,
        message: expect.stringContaining('без урахування регістру'),
      });

      const broken = checkCrumbsAudit(pair, audit(7));

      expect(broken.status).toBe(ERROR);
      expect(broken.problems[1]).toMatchObject({
        subject: BOTH,
        expected: 7,
        actual: 8,
      });
    });

    it('takes a hidden member like any other', () => {
      expect(
        checkCrumbsAudit(
          [{ ...member(), deletedAt: new Date() } as never],
          rows(100),
        ).status,
      ).toBe(OK);
    });
  });

  describe('checkCrumbsTracks', () => {
    const earned = [
      { nickname: 'Аня', season: SPRING, year: 2027, coins: 100 },
    ];

    it('is whole when a season holds what the tracks gave', () => {
      expect(checkCrumbsTracks([member()], earned, [], []).status).toBe(OK);
    });

    it('takes what was withdrawn off what the tracks gave', () => {
      const check = checkCrumbsTracks(
        [
          member({
            coins: 90,
            seasons: [{ season: SPRING, year: 2027, coins: 90 }],
          }),
        ],
        earned,
        [payout({ crumbSeason: SPRING, crumbs: 10 })],
        [],
      );

      expect(check.status).toBe(OK);
    });

    it('warns of a season that differs, and says what the audit knows of manual changes', () => {
      const check = checkCrumbsTracks(
        [
          member({
            coins: 130,
            seasons: [{ season: SPRING, year: 2027, coins: 130 }],
          }),
        ],
        earned,
        [],
        [
          {
            key: 'crumbs:аня',
            kind: AUDIT_KIND.MEMBER_ADJUSTED,
            crumbs: 30,
            rows: 1,
          },
        ],
      );

      expect(check.status).toBe(WARNING);
      expect(only(check)).toMatchObject({
        subject: 'Аня · Весна 2027',
        expected: 100,
        actual: 130,
        difference: 30,
      });
      expect(only(check).message).toContain('ручні правки');
      expect(only(check).message).toContain('за всі сезони');
      expect(only(check).message).toContain('+30');
    });

    it('finds a season the nickname has and the tracks do not know', () => {
      const check = checkCrumbsTracks([member()], [], [], []);

      expect(only(check)).toMatchObject({ expected: 0, actual: 100 });
    });

    it('finds tracks of a nickname that is not in the rating', () => {
      const check = checkCrumbsTracks(
        [],
        [{ nickname: 'Привид', season: SPRING, year: 2027, coins: 7 }],
        [],
        [],
      );

      expect(only(check)).toMatchObject({ subject: 'Привид', actual: 7 });
    });
  });
});

describe('unauditedNicknames', () => {
  it('lists the nicknames with crumbs that have no opening state, in order', () => {
    expect(
      unauditedNicknames([
        member({ nickname: 'Борис', crumbsAuditedAt: undefined }),
        member({ nickname: 'Аня', crumbsAuditedAt: undefined }),
        member({ nickname: 'Віка', crumbsAuditedAt: new Date() }),
        member({
          nickname: 'Нуль',
          crumbsAuditedAt: undefined,
          coins: 0,
          seasons: [],
        }),
      ]),
    ).toEqual(['Аня', 'Борис']);
  });
});

describe('reconcile', () => {
  const sound = (): ReconcileInput => ({
    groups: groups(income(), allocation()),
    entries: [income(), allocation()],
    requests: [],
    moneyAudit: [
      {
        key: 'jar:2027-spring',
        label: 'Банка Весна 2027',
        kop: 70000,
        rows: 1,
      },
      { key: 'support:site', label: 'Підтримка: Сайт', kop: 30000, rows: 1 },
    ],
    auditedEntryIds: new Set(['i1', 'a1']),
    crumbAudit: [
      {
        key: 'crumbs:аня',
        kind: AUDIT_KIND.CRUMBS_INITIAL,
        crumbs: 100,
        rows: 1,
      },
    ],
    crumbRowsOfEntries: new Map(),
    members: [member()],
    earned: [{ nickname: 'Аня', season: SPRING, year: 2027, coins: 100 }],
  });
  const at = new Date('2027-10-05T10:00:00Z');

  it('has every check once, in order, and says all is well', () => {
    const report = reconcile(sound(), at);

    expect(report.status).toBe(OK);
    expect(report.checkedAt).toBe(at);
    expect(report.checks.map(({ key }) => key)).toEqual(
      Object.values(RECONCILE_CHECK),
    );
    expect(report.checks.every(({ status }) => status === OK)).toBe(true);
    expect(report.counts).toEqual({
      entries: 2,
      auditRows: 3,
      members: 1,
      requests: 0,
    });
    expect(report.unaudited).toEqual([]);
  });

  it('counts the rows of the audit from the sums it was given', () => {
    const input = sound();

    input.moneyAudit = input.moneyAudit.map((row) => ({ ...row, rows: 5 }));
    input.crumbAudit = input.crumbAudit.map((row) => ({ ...row, rows: 3 }));

    expect(reconcile(input, at).counts.auditRows).toBe(5 + 5 + 3);
  });

  it('is a warning when only warnings were found, and an error when there is one', () => {
    const warned = sound();

    warned.members = [member({ crumbsAuditedAt: undefined })];

    expect(reconcile(warned, at).status).toBe(WARNING);
    expect(reconcile(warned, at).unaudited).toEqual(['Аня']);

    const broken = sound();

    broken.auditedEntryIds = new Set(['i1']);

    expect(reconcile(broken, at).status).toBe(ERROR);
  });

  it('keeps the first fifty problems of a check and says how many there are', () => {
    const many = sound();

    many.entries = Array.from({ length: 60 }, (_, index) =>
      income({ _id: `x${index}` }),
    );
    many.auditedEntryIds = new Set();

    const check = reconcile(many, at).checks.find(
      ({ key }) => key === RECONCILE_CHECK.UNAUDITED_ENTRIES,
    );

    expect(check?.total).toBe(60);
    expect(check?.problems).toHaveLength(50);
  });
});
