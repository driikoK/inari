import type { SEASON } from '../shared/index.js';
import type { NicknameCoins } from '../tracks/interfaces/track.interface.js';
import {
  describeEntry,
  effectsOf,
  kopOfCrumbs,
  round3,
  seasonLabel,
  snapshotOf,
} from './calc.js';
import { crumbsKey, formatSignedCrumbs } from './crumbs.js';
import {
  AUDIT_KIND,
  AUDIT_UNIT,
  ENTRY_TYPE,
  EXPENSE_KIND,
  EXPENSE_SECTION,
  KIND_LABEL,
  RECONCILE_CHECK,
  RECONCILE_STATUS,
  REQUEST_STATUS,
  SIDE_KIND,
} from './enums/index.js';
import type {
  BudgetEntry,
  CrumbAuditSum,
  EntryGroup,
  ExpenseEntry,
  MoneyAuditSum,
  ReconcileCheck,
  ReconcileProblem,
  ReconcileReport,
  WithdrawalRequest,
} from './interfaces/index.js';

const MAX_PROBLEMS = 50;
const CRUMBS_EPSILON = 0.0005;
const FLOAT_NOISE = 1e-9;

export interface MemberCrumbs {
  nickname: string;
  coins: number;
  seasons: { season: SEASON; year: number; coins: number }[];
  crumbsAuditedAt?: Date;
}

// Everything the checks look at, read once and from the sources themselves: the
// journal, the audit, the requests, the counters of the nicknames and the tracks
export interface ReconcileInput {
  groups: EntryGroup[];
  entries: BudgetEntry[];
  requests: WithdrawalRequest[];
  moneyAudit: MoneyAuditSum[];
  auditedEntryIds: Set<string>;
  crumbAudit: CrumbAuditSum[];
  // What the audit says about the crumbs of a payout, by the id of its entry
  crumbRowsOfEntries: Map<string, number>;
  members: MemberCrumbs[];
  earned: NicknameCoins[];
}

type Severity = ReconcileProblem['severity'];

const { ERROR, WARNING } = RECONCILE_STATUS;

const MANUAL_KINDS = [AUDIT_KIND.MEMBER_ADJUSTED, AUDIT_KIND.MEMBER_CREATED];

const STATUS_LABEL: Record<REQUEST_STATUS, string> = {
  [REQUEST_STATUS.OPEN]: 'відкритий',
  [REQUEST_STATUS.DONE]: 'виконаний',
  [REQUEST_STATUS.REJECTED]: 'відхилений',
  [REQUEST_STATUS.CANCELLED]: 'скасований',
};

const money = (
  subject: string,
  message: string,
  expected: number,
  actual: number,
  severity: Severity = ERROR,
): ReconcileProblem => ({
  severity,
  subject,
  message,
  unit: AUDIT_UNIT.MONEY,
  expected,
  actual,
  difference: actual - expected,
});

const crumbs = (
  subject: string,
  message: string,
  expected: number,
  actual: number,
  severity: Severity = ERROR,
): ReconcileProblem => ({
  severity,
  subject,
  message,
  unit: AUDIT_UNIT.CRUMBS,
  expected: round3(expected),
  actual: round3(actual),
  difference: round3(actual - expected),
});

const note = (
  subject: string,
  message: string,
  severity: Severity = ERROR,
): ReconcileProblem => ({ severity, subject, message });

// Crumbs are kept to a thousandth, so half of it is the least that can be told.
// A sum of rows that were rounded one by one may be off by that much for each.
const differs = (a: number, b: number, rows = 1) =>
  Math.abs(a - b) > CRUMBS_EPSILON * Math.max(rows, 1) + FLOAT_NOISE;

const byText = (a: string, b: string) => a.localeCompare(b, 'uk');

const finish = (
  key: RECONCILE_CHECK,
  title: string,
  description: string,
  problems: ReconcileProblem[],
): ReconcileCheck => ({
  key,
  title,
  description,
  status: problems.some(({ severity }) => severity === ERROR)
    ? ERROR
    : problems.length > 0
      ? WARNING
      : RECONCILE_STATUS.OK,
  total: problems.length,
  problems: problems.slice(0, MAX_PROBLEMS),
});

interface Side {
  kind: SIDE_KIND;
  label: string;
  kop: number;
}

// What every side of the budget holds, added up again from the records
export const sidesOf = (groups: EntryGroup[]): Map<string, Side> => {
  const sides = new Map<string, Side>();

  for (const group of groups) {
    for (const { kind, key, label, deltaKop } of effectsOf(group)) {
      const side = sides.get(key) ?? { kind, label, kop: 0 };

      side.kop += deltaKop * (group.count ?? 1);
      sides.set(key, side);
    }
  }

  return sides;
};

const nameOfEntry = (entry: BudgetEntry) => describeEntry(snapshotOf(entry));

// The money a record brings in or takes out of the team, told without effects:
// an income brings it in, a card or a donation takes it out, and an allocation
// or a gift to the team only moves it between the sides
export const checkConfectionery = (
  groups: EntryGroup[],
  sides = sidesOf(groups),
): ReconcileCheck => {
  const holders = [SIDE_KIND.JAR, SIDE_KIND.ORDERS, SIDE_KIND.SUPPORT];
  let actual = 0;
  let expected = 0;

  for (const { kind, kop } of sides.values()) {
    if (holders.includes(kind)) actual += kop;
  }

  for (const group of groups) {
    const times = group.count ?? 1;

    switch (group.type) {
      case ENTRY_TYPE.ALLOCATION:
        break;
      case ENTRY_TYPE.EXPENSE:
        if (group.kind !== EXPENSE_KIND.DEVELOPMENT) {
          expected -= group.amountKop * times;
        }
        break;
      default:
        expected += group.amountKop * times;
    }
  }

  return finish(
    RECONCILE_CHECK.CONFECTIONERY,
    'Кондитерська збігається з надходженнями',
    'Усі надходження мінус виплати на карту та донатом дорівнюють сумі банок, тістечок замовлень і печивка підтримки.',
    actual === expected
      ? []
      : [
          money(
            'Кондитерська',
            'Сума банок, тістечок і підтримки не дорівнює надходженням мінус виплати',
            expected,
            actual,
          ),
        ],
  );
};

export const checkNegative = (
  groups: EntryGroup[],
  sides = sidesOf(groups),
): ReconcileCheck =>
  finish(
    RECONCILE_CHECK.NEGATIVE,
    'Нічого не мінусове',
    'Жодна банка, бюджет тайтла, напрямок підтримки, смаколики чи лисодар не пішли нижче нуля.',
    [...sides.values()]
      .filter(({ kop }) => kop < 0)
      .sort((a, b) => byText(a.label, b.label))
      .map(({ label, kop }) => money(label, 'Баланс менший за нуль', 0, kop)),
  );

export const checkAuditMoney = (
  groups: EntryGroup[],
  moneyAudit: MoneyAuditSum[],
  sides = sidesOf(groups),
): ReconcileCheck => {
  const audited = new Map(moneyAudit.map((row) => [row.key, row]));
  const problems = [...new Set([...sides.keys(), ...audited.keys()])]
    .sort()
    .flatMap((key) => {
      const expected = sides.get(key)?.kop ?? 0;
      const actual = audited.get(key)?.kop ?? 0;

      return expected === actual
        ? []
        : [
            money(
              sides.get(key)?.label ?? audited.get(key)?.label ?? key,
              'Рядки аудиту дають іншу суму, ніж журнал',
              expected,
              actual,
            ),
          ];
    });

  return finish(
    RECONCILE_CHECK.AUDIT_MONEY,
    'Аудит грошей збігається з журналом',
    'Рядки аудиту по кожній банці, бюджету й напрямку дають ту саму суму, що й записи журналу.',
    problems,
  );
};

export const checkUnauditedEntries = (
  entries: BudgetEntry[],
  auditedEntryIds: Set<string>,
): ReconcileCheck =>
  finish(
    RECONCILE_CHECK.UNAUDITED_ENTRIES,
    'Кожен запис журналу є в аудиті',
    'Якщо після операції аудит не записався (відповідь «запис в аудит не збережено»), такий запис буде тут.',
    entries
      .filter(({ _id }) => !auditedEntryIds.has(String(_id)))
      .map((entry) =>
        note(
          nameOfEntry(entry),
          `Запис від ${entry.date} (${entry.createdBy}) є в журналі, але його немає в аудиті`,
        ),
      ),
  );

const isCrumbPayout = (entry: BudgetEntry): entry is ExpenseEntry =>
  entry.type === ENTRY_TYPE.EXPENSE && entry.section === EXPENSE_SECTION.CRUMBS;

export const checkEntries = (entries: BudgetEntry[]): ReconcileCheck => {
  const problems: ReconcileProblem[] = [];

  for (const entry of entries) {
    if (!Number.isInteger(entry.amountKop)) {
      problems.push(
        money(
          nameOfEntry(entry),
          'Сума запису не є цілою кількістю копійок',
          Math.round(entry.amountKop),
          entry.amountKop,
        ),
      );
    }

    if (!isCrumbPayout(entry)) continue;

    const { crumbs: taken, coefficient, crumbSeason, crumbYear } = entry;

    if (
      taken === undefined ||
      coefficient === undefined ||
      !crumbSeason ||
      crumbYear === undefined
    ) {
      problems.push(
        note(
          nameOfEntry(entry),
          'У виплати за крихти немає крихт, коефіцієнта чи сезону, з якого вони взяті',
        ),
      );
    } else if (entry.amountKop !== kopOfCrumbs(taken, coefficient)) {
      problems.push(
        money(
          nameOfEntry(entry),
          'Виплата не дорівнює крихтам, помноженим на коефіцієнт',
          kopOfCrumbs(taken, coefficient),
          entry.amountKop,
        ),
      );
    }
  }

  return finish(
    RECONCILE_CHECK.ENTRIES,
    'Записи журналу правильні',
    'Суми цілі, а виплата за крихти дорівнює крихтам, помноженим на коефіцієнт, за яким її виплатили.',
    problems,
  );
};

const nameOfRequest = ({ nickname, kind, closedDay }: WithdrawalRequest) =>
  `Запит: ${nickname} — ${KIND_LABEL[kind]}${closedDay ? `, ${closedDay}` : ''}`;

export const checkRequests = (
  requests: WithdrawalRequest[],
  entries: BudgetEntry[],
  crumbRowsOfEntries: Map<string, number>,
): ReconcileCheck => {
  const payouts = new Map<string, ExpenseEntry[]>();
  const byId = new Map(
    requests.map((request) => [String(request._id), request]),
  );
  const problems: ReconcileProblem[] = [];

  for (const entry of entries) {
    if (entry.type !== ENTRY_TYPE.EXPENSE || !entry.requestId) continue;

    payouts.set(entry.requestId, [
      ...(payouts.get(entry.requestId) ?? []),
      entry,
    ]);
  }

  for (const request of requests) {
    if (request.status !== REQUEST_STATUS.DONE) continue;

    const name = nameOfRequest(request);
    const own = payouts.get(String(request._id)) ?? [];
    const paidKop = request.paidKop ?? 0;
    const inJournal = own.reduce(
      (total, { amountKop }) => total + amountKop,
      0,
    );

    if (own.length === 0) {
      problems.push(
        money(name, 'Запит виконано, але виплат у журналі немає', paidKop, 0),
      );
    } else if (inJournal !== paidKop) {
      problems.push(
        money(
          name,
          'Виплати в журналі не дорівнюють сумі запиту',
          paidKop,
          inJournal,
        ),
      );
    }

    if (request.isOrder) continue;

    const wanted = (request.parts ?? []).reduce(
      (total, part) => total + part.crumbs,
      0,
    );
    const taken = own.reduce(
      (total, { crumbs: value }) => total + (value ?? 0),
      0,
    );

    if (own.length > 0 && differs(wanted, taken)) {
      problems.push(
        crumbs(
          name,
          'Крихти виплат не дорівнюють крихтам запиту',
          wanted,
          taken,
        ),
      );
    }

    for (const payout of own) {
      const expected = -(payout.crumbs ?? 0);
      const logged = crumbRowsOfEntries.get(String(payout._id));

      if (logged === undefined) {
        problems.push(
          crumbs(
            nameOfEntry(payout),
            'Для виплати немає рядка аудиту про крихти, зняті з нікнейма',
            expected,
            0,
          ),
        );
      } else if (differs(logged, expected)) {
        problems.push(
          crumbs(
            nameOfEntry(payout),
            'Крихти, зняті в аудиті, не дорівнюють виплаті',
            expected,
            logged,
          ),
        );
      }
    }
  }

  for (const [requestId, own] of payouts) {
    const request = byId.get(requestId);

    for (const payout of own) {
      if (!request) {
        problems.push(
          note(nameOfEntry(payout), 'Виплата належить запиту, якого немає'),
        );
      } else if (request.status !== REQUEST_STATUS.DONE) {
        problems.push(
          note(
            nameOfEntry(payout),
            `Виплата належить запиту, який ${STATUS_LABEL[request.status]}, а не виконаний`,
          ),
        );
      }
    }
  }

  return finish(
    RECONCILE_CHECK.REQUESTS,
    'Виконані запити збігаються з виплатами',
    'Кожному виконаному запиту відповідають виплати в журналі та рядки аудиту про зняті крихти, а кожна виплата належить виконаному запиту.',
    problems,
  );
};

const seasonsOf = ({ seasons }: MemberCrumbs) => seasons ?? [];

const sorted = (members: MemberCrumbs[]) =>
  [...members].sort((a, b) => byText(a.nickname, b.nickname));

export const checkCrumbsSum = (members: MemberCrumbs[]): ReconcileCheck =>
  finish(
    RECONCILE_CHECK.CRUMBS_SUM,
    'Баланс крихт збігається з сезонами',
    'Загальні крихти нікнейма дорівнюють сумі його сезонів.',
    sorted(members).flatMap((member) => {
      const total = seasonsOf(member).reduce(
        (sum, { coins }) => sum + coins,
        0,
      );

      return differs(member.coins ?? 0, total)
        ? [
            crumbs(
              member.nickname,
              'Загальні крихти не дорівнюють сумі сезонів',
              total,
              member.coins ?? 0,
              WARNING,
            ),
          ]
        : [];
    }),
  );

export const checkCrumbsNegative = (members: MemberCrumbs[]): ReconcileCheck =>
  finish(
    RECONCILE_CHECK.CRUMBS_NEGATIVE,
    'Крихти не мінусові',
    'Ні загальний баланс нікнейма, ні жоден його сезон не нижчі за нуль.',
    sorted(members).flatMap((member) => [
      ...((member.coins ?? 0) < -CRUMBS_EPSILON
        ? [
            crumbs(
              member.nickname,
              'Загальні крихти менші за нуль',
              0,
              member.coins,
            ),
          ]
        : []),
      ...seasonsOf(member)
        .filter(({ coins }) => coins < -CRUMBS_EPSILON)
        .map(({ season, year, coins }) =>
          crumbs(
            `${member.nickname} · ${seasonLabel(season, year)}`,
            'Крихти сезону менші за нуль',
            0,
            coins,
          ),
        ),
    ]),
  );

const hasCrumbs = (member: MemberCrumbs) =>
  differs(member.coins ?? 0, 0) ||
  seasonsOf(member).some(({ coins }) => differs(coins, 0));

// A nickname with crumbs that nothing in the audit has described yet
export const unauditedNicknames = (members: MemberCrumbs[]): string[] =>
  sorted(members)
    .filter((member) => !member.crumbsAuditedAt && hasCrumbs(member))
    .map(({ nickname }) => nickname);

// The audit tells nicknames apart by their trimmed lower-case name, so two that
// differ only in case are one subject there and are added up here as well
export const checkCrumbsAudit = (
  members: MemberCrumbs[],
  crumbAudit: CrumbAuditSum[],
): ReconcileCheck => {
  const sums = new Map<string, { crumbs: number; rows: number }>();
  const subjects = new Map<string, MemberCrumbs[]>();
  const problems: ReconcileProblem[] = [];

  for (const { key, crumbs: delta, rows } of crumbAudit) {
    const known = sums.get(key) ?? { crumbs: 0, rows: 0 };

    sums.set(key, { crumbs: known.crumbs + delta, rows: known.rows + rows });
  }

  for (const member of sorted(members)) {
    const key = crumbsKey(member.nickname);

    subjects.set(key, [...(subjects.get(key) ?? []), member]);
  }

  for (const [key, group] of subjects) {
    const names = group.map(({ nickname }) => nickname).join(' / ');
    const audit = sums.get(key) ?? { crumbs: 0, rows: 0 };

    if (group.length > 1) {
      problems.push(
        note(
          names,
          'Нікнейми однакові без урахування регістру, тому аудит рахує їхні крихти разом',
          WARNING,
        ),
      );
    }

    if (group.some(({ crumbsAuditedAt }) => crumbsAuditedAt)) {
      const coins = group.reduce((sum, member) => sum + (member.coins ?? 0), 0);

      if (differs(coins, audit.crumbs, audit.rows)) {
        problems.push(
          crumbs(
            names,
            'Рядки аудиту дають інші крихти, ніж у рейтингу',
            round3(audit.crumbs),
            coins,
          ),
        );
      }
    } else {
      for (const member of group.filter(hasCrumbs)) {
        problems.push(
          note(
            member.nickname,
            'Крихти ще не під аудитом: їхній початковий стан запишеться при першій зміні або кнопкою нижче',
            WARNING,
          ),
        );
      }
    }
  }

  for (const [key, { crumbs: sum, rows }] of [...sums].sort(([a], [b]) =>
    byText(a, b),
  )) {
    if (!subjects.has(key) && differs(sum, 0, rows)) {
      problems.push(
        crumbs(
          key.replace(/^crumbs:/, ''),
          'В аудиті є крихти нікнейма, якого немає в рейтингу',
          0,
          sum,
        ),
      );
    }
  }

  return finish(
    RECONCILE_CHECK.CRUMBS_AUDIT,
    'Аудит крихт збігається з рейтингом',
    'Рядки аудиту кожного нікнейма (початковий стан і всі зміни) дають його баланс.',
    problems,
  );
};

export const checkCrumbsTracks = (
  members: MemberCrumbs[],
  earned: NicknameCoins[],
  entries: BudgetEntry[],
  crumbAudit: CrumbAuditSum[],
): ReconcileCheck => {
  const seasonKey = (season: SEASON, year: number) => `${year}-${season}`;
  const perNickname = new Map<
    string,
    Map<string, { season: SEASON; year: number; earned: number; paid: number }>
  >();
  const slot = (nickname: string, season: SEASON, year: number) => {
    const seasons = perNickname.get(nickname) ?? new Map();
    const key = seasonKey(season, year);
    const known = seasons.get(key) ?? { season, year, earned: 0, paid: 0 };

    seasons.set(key, known);
    perNickname.set(nickname, seasons);

    return known;
  };

  for (const track of earned) {
    slot(track.nickname, track.season, track.year).earned += track.coins;
  }

  for (const entry of entries) {
    if (
      isCrumbPayout(entry) &&
      entry.crumbSeason &&
      entry.crumbYear !== undefined
    ) {
      slot(entry.nickname, entry.crumbSeason, entry.crumbYear).paid +=
        entry.crumbs ?? 0;
    }
  }

  const manual = new Map<string, number>();

  for (const { key, kind, crumbs: delta } of crumbAudit) {
    if (MANUAL_KINDS.includes(kind))
      manual.set(key, (manual.get(key) ?? 0) + delta);
  }

  const problems: ReconcileProblem[] = [];

  for (const member of sorted(members)) {
    for (const { season, year } of seasonsOf(member)) {
      slot(member.nickname, season, year);
    }

    const edited = manual.get(crumbsKey(member.nickname)) ?? 0;
    const rows = [...(perNickname.get(member.nickname)?.values() ?? [])].sort(
      (a, b) => a.year - b.year || byText(a.season, b.season),
    );

    for (const row of rows) {
      const expected = round3(row.earned - row.paid);
      const actual =
        seasonsOf(member).find(
          ({ season, year }) => season === row.season && year === row.year,
        )?.coins ?? 0;

      if (differs(actual, expected)) {
        problems.push(
          crumbs(
            `${member.nickname} · ${seasonLabel(row.season, row.year)}`,
            `Крихти сезону не дорівнюють зарахованим за треками мінус виведеним${
              differs(edited, 0)
                ? `. У аудиті є ручні правки нікнейма за всі сезони разом: ${formatSignedCrumbs(round3(edited))}`
                : ''
            }`,
            expected,
            actual,
            WARNING,
          ),
        );
      }
    }
  }

  const names = new Set(members.map(({ nickname }) => nickname));

  for (const nickname of [...perNickname.keys()].sort(byText)) {
    if (names.has(nickname)) continue;

    const total = [...(perNickname.get(nickname)?.values() ?? [])].reduce(
      (sum, row) => sum + row.earned,
      0,
    );

    if (differs(total, 0)) {
      problems.push(
        crumbs(
          nickname,
          'Є треки нікнейма, якого немає в рейтингу',
          0,
          total,
          WARNING,
        ),
      );
    }
  }

  return finish(
    RECONCILE_CHECK.CRUMBS_TRACKS,
    'Крихти збігаються з треками',
    'У кожному сезоні крихти нікнейма дорівнюють зарахованим за треками мінус виведеним. Ручні правки в рейтингу дають розбіжність, яку тут видно.',
    problems,
  );
};

export const reconcile = (
  input: ReconcileInput,
  checkedAt: Date,
): ReconcileReport => {
  const sides = sidesOf(input.groups);
  const checks = [
    checkConfectionery(input.groups, sides),
    checkNegative(input.groups, sides),
    checkAuditMoney(input.groups, input.moneyAudit, sides),
    checkUnauditedEntries(input.entries, input.auditedEntryIds),
    checkEntries(input.entries),
    checkRequests(input.requests, input.entries, input.crumbRowsOfEntries),
    checkCrumbsSum(input.members),
    checkCrumbsNegative(input.members),
    checkCrumbsAudit(input.members, input.crumbAudit),
    checkCrumbsTracks(
      input.members,
      input.earned,
      input.entries,
      input.crumbAudit,
    ),
  ];

  return {
    checkedAt,
    status: checks.some(({ status }) => status === ERROR)
      ? ERROR
      : checks.some(({ status }) => status === WARNING)
        ? WARNING
        : RECONCILE_STATUS.OK,
    counts: {
      entries: input.entries.length,
      auditRows: [...input.moneyAudit, ...input.crumbAudit].reduce(
        (total, { rows }) => total + rows,
        0,
      ),
      members: input.members.length,
      requests: input.requests.length,
    },
    checks,
    unaudited: unauditedNicknames(input.members),
  };
};
