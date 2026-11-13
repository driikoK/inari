import {
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createMock, type DeepMocked } from '@golevelup/ts-vitest';
import { Model, Types } from 'mongoose';
import { vi } from 'vitest';
import { MembersService } from '../members/members.service.js';
import { SEASON } from '../shared/index.js';
import type { ValidatedUser } from '../users/interfaces/user.interface.js';
import { UsersService } from '../users/users.service.js';
import { BudgetService } from './budget.service.js';
import {
  AUDIT_KIND,
  ENTRY_TYPE,
  EXPENSE_KIND,
  EXPENSE_SECTION,
  REQUEST_STATUS,
} from './enums/index.js';
import type {
  ExpenseEntry,
  SeasonRate,
  WithdrawalRequest,
} from './interfaces/index.js';
import { RequestsService } from './requests.service.js';

const CARD = '4111 1111 1111 1111';

describe('RequestsService', () => {
  const requestId = new Types.ObjectId();
  const rates: SeasonRate[] = [
    { season: SEASON.WINTER, year: 2027, coefficient: 2 },
    { season: SEASON.SPRING, year: 2027, coefficient: 3.5 },
    { season: SEASON.SUMMER, year: 2027, coefficient: 0 },
  ];
  const user = {
    _id: 'u1',
    username: 'anya',
    nickname: 'Аня',
    role: 'member',
  } as ValidatedUser;
  const boss = 'boss';

  let service: RequestsService;
  let requests: DeepMocked<Model<WithdrawalRequest>>;
  let budget: DeepMocked<BudgetService>;
  let members: DeepMocked<MembersService>;
  let users: DeepMocked<UsersService>;
  let rowsOfCommit: any[];

  const member = (extra: object = {}) =>
    ({
      nickname: 'Аня',
      coins: 225,
      seasons: [
        { season: SEASON.SPRING, year: 2027, coins: 100 },
        { season: SEASON.WINTER, year: 2027, coins: 40 },
        { season: SEASON.SUMMER, year: 2027, coins: 70 },
        { season: SEASON.FALL, year: 2027, coins: 15 },
      ],
      ...extra,
    }) as any;

  const line = (extra: Partial<WithdrawalRequest> = {}): WithdrawalRequest => ({
    _id: requestId,
    status: REQUEST_STATUS.OPEN,
    username: 'anya',
    nickname: 'Аня',
    groupId: 'g1',
    kind: EXPENSE_KIND.CARD,
    isOrder: false,
    crumbs: 60,
    requisite: CARD,
    createdAt: new Date('2027-10-01T10:00:00Z'),
    ...extra,
  });

  const found = (list: WithdrawalRequest[]) =>
    requests.find.mockReturnValue({
      sort: () => ({ lean: vi.fn().mockResolvedValue(list) }),
    } as any);
  const byId = (value: WithdrawalRequest | null) =>
    requests.findById.mockReturnValue({
      lean: vi.fn().mockResolvedValue(value),
    } as any);
  const claimed = (value: WithdrawalRequest | null) =>
    requests.findOneAndUpdate.mockReturnValue({
      lean: vi.fn().mockResolvedValue(value),
    } as any);
  const reserved = (crumbs: number, username = 'anya') =>
    requests.aggregate.mockResolvedValue(
      crumbs ? [{ _id: { nickname: 'Аня', username }, crumbs }] : ([] as any),
    );

  const ask = (lines: object[], extra: object = {}): any => ({
    isOrder: false,
    lines,
    ...extra,
  });
  const card = (crumbs: number) => ({
    kind: EXPENSE_KIND.CARD,
    crumbs,
    requisite: CARD,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-10-05T12:00:00Z'));

    requests = createMock<Model<WithdrawalRequest>>();
    budget = createMock<BudgetService>();
    members = createMock<MembersService>();
    users = createMock<UsersService>();
    service = new RequestsService(requests, budget, members, users);
    rowsOfCommit = [];

    budget.exclusive.mockImplementation((job: () => Promise<unknown>) => job());
    budget.seasonRates.mockResolvedValue(rates);
    budget.requestFacts.mockResolvedValue({ rates, orders: [] });
    users.nicknamesOf.mockResolvedValue(new Map([['anya', 'Аня']]));
    budget.commit.mockImplementation(
      async (_kind, _actor, _description, _changes, persist, options) => {
        const saved = await persist();

        rowsOfCommit =
          options?.extraRows?.({ operationId: 'op' } as any, saved) ?? [];

        return saved;
      },
    );
    members.findVisibleByNicknames.mockResolvedValue([member()]);
    members.findByNickname.mockResolvedValue(member());
    members.changeCoins.mockImplementation(
      async (nickname, { season, year, delta }) =>
        ({
          nickname,
          season,
          year,
          delta,
          coins: 225 + delta,
          seasonCoins: 100 + delta,
        }) as any,
    );
    requests.updateOne.mockResolvedValue({} as any);
    budget.removeByRequest.mockResolvedValue({} as any);
    budget.insertEntries.mockResolvedValue([] as any);
    reserved(0);
    found([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('mine', () => {
    it('says nothing to a user without a nickname', async () => {
      const result = await service.mine({ ...user, nickname: undefined });

      expect(result).toMatchObject({
        nickname: null,
        balance: 0,
        availableCrumbs: 0,
        shares: [],
        requests: [],
      });
    });

    it('shows what can be withdrawn: finished seasons with a coefficient, minus what is reserved', async () => {
      reserved(30);

      const result = await service.mine(user);

      expect(result).toMatchObject({
        nickname: 'Аня',
        balance: 225,
        reservedCrumbs: 30,
        availableCrumbs: 110,
        lockedCrumbs: 85,
      });
      expect(
        result.shares.map(({ season, crumbs }) => [season, crumbs]),
      ).toEqual([
        [SEASON.WINTER, 40],
        [SEASON.SPRING, 100],
      ]);
    });

    it('asks for the requests of this account, the open ones and those closed this season', async () => {
      await service.mine(user);

      expect(requests.find).toHaveBeenCalledWith({
        username: 'anya',
        $or: [
          { status: REQUEST_STATUS.OPEN },
          { closedDay: { $gte: '2027-10-01' } },
        ],
      });
    });

    it('prices an open line at the rates of now and never shows a full card number', async () => {
      found([line()]);

      const [view] = (await service.mine(user)).requests;

      expect(view.estimate).toMatchObject({ amountKop: 8000 + 7000 });
      expect(view.requisite).toBe('•••• 1111');
    });
  });

  describe('create', () => {
    it('saves a line for every section with one group, the account and the nickname', async () => {
      requests.insertMany.mockImplementation(async (docs: any) =>
        docs.map((doc: any) => ({
          toObject: () => ({ ...doc, _id: requestId }),
        })),
      );

      const views = await service.create(
        user,
        ask([card(30), { kind: EXPENSE_KIND.DEVELOPMENT, crumbs: 10 }], {
          comment: 'Дякую',
        }),
      );
      const docs = requests.insertMany.mock.calls[0][0] as any[];

      expect(docs).toHaveLength(2);
      expect(new Set(docs.map(({ groupId }) => groupId)).size).toBe(1);
      expect(docs[0]).toMatchObject({
        status: REQUEST_STATUS.OPEN,
        username: 'anya',
        nickname: 'Аня',
        kind: EXPENSE_KIND.CARD,
        isOrder: false,
        crumbs: 30,
        requisite: CARD,
        comment: 'Дякую',
      });
      expect(docs[1]).not.toHaveProperty('requisite');
      expect(views).toHaveLength(2);
      expect(views[0].requisite).toBe('•••• 1111');
    });

    it('refuses a user without a nickname', async () => {
      await expect(
        service.create({ ...user, nickname: undefined }, ask([card(1)])),
      ).rejects.toThrow(/нікнеймом команди/);
      expect(requests.insertMany).not.toHaveBeenCalled();
    });

    it('refuses more crumbs than are free, counting what open requests already hold', async () => {
      reserved(100);

      await expect(service.create(user, ask([card(50)]))).rejects.toThrow(
        /доступно лише 40 крихт, а ви просите 50/,
      );
      expect(requests.insertMany).not.toHaveBeenCalled();
    });

    it('does not count the crumbs held by a line whose account no longer has the nickname', async () => {
      reserved(100, 'former');
      requests.insertMany.mockImplementation(async (docs: any) =>
        docs.map((doc: any) => ({
          toObject: () => ({ ...doc, _id: requestId }),
        })),
      );

      await service.create(user, ask([card(50)]));

      expect(requests.insertMany).toHaveBeenCalled();
    });

    it('adds up the lines of one request before it decides', async () => {
      await expect(
        service.create(
          user,
          ask([card(100), { ...card(50), kind: EXPENSE_KIND.DONATION }]),
        ),
      ).rejects.toThrow(ConflictException);
    });

    describe('when there is nothing to withdraw', () => {
      const only = (seasons: object[]) =>
        members.findVisibleByNicknames.mockResolvedValue([member({ seasons })]);

      it('says the running season has to end first', async () => {
        only([{ season: SEASON.FALL, year: 2027, coins: 15 }]);

        await expect(service.create(user, ask([card(1)]))).rejects.toThrow(
          /«Осінь 2027» можна вивести після його завершення/,
        );
      });

      it('names a finished season that has crumbs but no money in its jar', async () => {
        only([{ season: SEASON.SUMMER, year: 2027, coins: 70 }]);

        await expect(service.create(user, ask([card(1)]))).rejects.toThrow(
          /«Літо 2027» поки не можна вивести: у банці цього сезону немає грошей/,
        );
      });

      it('names a finished season that is not among the rates at all', async () => {
        only([{ season: SEASON.WINTER, year: 2024, coins: 96.25 }]);

        await expect(service.create(user, ask([card(1)]))).rejects.toThrow(
          /«Зима 2024».*Адмін має внести надходження/,
        );
      });

      it('says both reasons when both apply', async () => {
        only([
          { season: SEASON.WINTER, year: 2024, coins: 96.25 },
          { season: SEASON.FALL, year: 2027, coins: 15 },
        ]);

        await expect(service.create(user, ask([card(1)]))).rejects.toThrow(
          /«Зима 2024».*«Осінь 2027» можна вивести після його завершення/,
        );
      });

      it('says the open requests hold it all when everything that can be paid is reserved', async () => {
        reserved(140);

        await expect(service.create(user, ask([card(1)]))).rejects.toThrow(
          /уже в ваших відкритих запитах/,
        );
      });

      it('says there is nothing for a nickname with no crumbs, and gives the same answer to the preview of the form', async () => {
        only([]);

        await expect(service.create(user, ask([card(1)]))).rejects.toThrow(
          /У вас немає крихт для виводу/,
        );

        const preview = await service.preview(user, ask([card(1)]));

        expect(preview.problem).toBe('У вас немає крихт для виводу');
      });
    });

    it('refuses a nickname that is hidden or gone', async () => {
      members.findVisibleByNicknames.mockResolvedValue([]);

      await expect(service.create(user, ask([card(1)]))).rejects.toThrow(
        /не знайдено серед учасників/,
      );
    });

    describe('for an order', () => {
      const budgetLine = {
        key: 'project:p1',
        title: 'Вітробой',
        projectId: 'p1',
        receivedKop: 90000,
        spentKop: 0,
        balanceKop: 90000,
      };
      const order = (amountKop: number, extra: object = {}): any => ({
        isOrder: true,
        projectId: 'p1',
        lines: [{ kind: EXPENSE_KIND.CARD, amountKop, requisite: CARD }],
        ...extra,
      });

      beforeEach(() => {
        budget.requestFacts.mockResolvedValue({
          rates,
          orders: [budgetLine],
        });
        requests.insertMany.mockImplementation(async (docs: any) =>
          docs.map((doc: any) => ({
            toObject: () => ({ ...doc, _id: requestId }),
          })),
        );
      });

      it('is in hryvnias, leaves the crumbs alone and takes the title from the budget', async () => {
        await service.create(user, order(50000));

        const [doc] = requests.insertMany.mock.calls[0][0] as any[];

        expect(doc).toMatchObject({
          isOrder: true,
          amountKop: 50000,
          projectId: 'p1',
          title: 'Вітробой',
        });
        expect(doc).not.toHaveProperty('crumbs');
        expect(requests.aggregate).toHaveBeenCalled();
      });

      it('needs a budget of its own', async () => {
        await expect(
          service.create(
            user,
            order(1000, { projectId: undefined, title: 'Невідомий' }),
          ),
        ).rejects.toThrow('Для цього тайтлу ще немає бюджету замовлення');
      });

      it('may be written out as text, as the budget is one however it is spelled', async () => {
        budget.requestFacts.mockResolvedValue({
          rates,
          orders: [
            { ...budgetLine, key: 'title:вітробой', projectId: undefined },
          ],
        });

        await service.create(
          user,
          order(1000, { projectId: undefined, title: ' ВІТРОБОЙ ' }),
        );

        expect(requests.insertMany).toHaveBeenCalled();
      });

      it('cannot ask for more than the budget of the title holds', async () => {
        await expect(service.create(user, order(90001))).rejects.toThrow(
          /є лише 900,00 грн/,
        );
      });
    });
  });

  describe('preview', () => {
    it('prices the lines one after another, as the crumbs of one season cannot be taken twice', async () => {
      const result = await service.preview(
        user,
        ask([card(30), { ...card(30), kind: EXPENSE_KIND.DONATION }]),
      );

      expect(result.problem).toBeNull();
      expect(result.lines[0].estimate?.parts).toEqual([
        expect.objectContaining({
          season: SEASON.WINTER,
          crumbs: 30,
          amountKop: 6000,
        }),
      ]);
      expect(result.lines[1].estimate?.parts).toEqual([
        expect.objectContaining({
          season: SEASON.WINTER,
          crumbs: 10,
          amountKop: 2000,
        }),
        expect.objectContaining({
          season: SEASON.SPRING,
          crumbs: 20,
          amountKop: 7000,
        }),
      ]);
      expect(result.info.availableCrumbs).toBe(140);
    });

    it('answers with the problem instead of refusing, so a form can show it', async () => {
      const result = await service.preview(user, ask([card(500)]));

      expect(result.problem).toMatch(/доступно лише 140 крихт/);
      expect(result.lines[0].estimate).toBeNull();
    });

    it('saves nothing', async () => {
      await service.preview(user, ask([card(10)]));

      expect(requests.insertMany).not.toHaveBeenCalled();
    });

    it('names a line that would pay less than a kopiyka', async () => {
      budget.requestFacts.mockResolvedValue({
        rates: [{ season: SEASON.WINTER, year: 2027, coefficient: 0.0001 }],
        orders: [],
      });

      const result = await service.preview(user, ask([card(0.001)]));

      expect(result.problem).toBe('Сума виплати менша за копійку');
    });
  });

  describe('cancel and reject', () => {
    it('lets the owner cancel an open line, which keeps only the last digits', async () => {
      byId(line());
      claimed({
        ...line(),
        status: REQUEST_STATUS.CANCELLED,
        requisite: '•••• 1111',
      });

      const view = await service.cancel(user, String(requestId));
      const [filter, update] = requests.findOneAndUpdate.mock.calls[0] as any[];

      expect(filter).toEqual({ _id: requestId, status: REQUEST_STATUS.OPEN });
      expect(update.$set).toMatchObject({
        status: REQUEST_STATUS.CANCELLED,
        closedBy: 'anya',
        closedDay: '2027-10-05',
        requisite: '•••• 1111',
      });
      expect(view.status).toBe(REQUEST_STATUS.CANCELLED);
      expect(view.requisite).toBe('•••• 1111');
    });

    it('does not let somebody else cancel it', async () => {
      byId(line({ username: 'other' }));

      await expect(service.cancel(user, String(requestId))).rejects.toThrow(
        ForbiddenException,
      );
      expect(requests.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('answers 409 for a line that is already closed and 404 for an unknown one', async () => {
      byId(line({ status: REQUEST_STATUS.DONE }));
      await expect(service.cancel(user, String(requestId))).rejects.toThrow(
        ConflictException,
      );

      byId(null);
      await expect(service.cancel(user, String(requestId))).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.cancel(user, 'nope')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lets the admin reject, signed with the admin', async () => {
      byId(line());
      claimed({ ...line(), status: REQUEST_STATUS.REJECTED });

      await service.reject(String(requestId), boss);

      const [, update] = requests.findOneAndUpdate.mock.calls[0] as any[];

      expect(update.$set).toMatchObject({
        status: REQUEST_STATUS.REJECTED,
        closedBy: boss,
      });
    });

    it('answers 409 when the line was closed between the read and the write', async () => {
      byId(line());
      claimed(null);

      await expect(service.reject(String(requestId), boss)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('queue', () => {
    it('shows the admin the full card of an open line and only the end of a closed one', async () => {
      found([
        line(),
        line({
          _id: new Types.ObjectId(),
          status: REQUEST_STATUS.DONE,
          requisite: '•••• 2222',
          closedDay: '2027-10-02',
        }),
      ]);

      const [open, done] = await service.queue();

      expect(open.requisite).toBe(CARD);
      expect(done.requisite).toBe('•••• 2222');
    });

    it('prices an open line and names the problem of one that cannot be paid now', async () => {
      found([line(), line({ _id: new Types.ObjectId(), crumbs: 500 })]);

      const [fine, short] = await service.queue();

      expect(fine.estimate?.amountKop).toBe(15000);
      expect(fine.problem).toBeNull();
      expect(short.estimate).toBeNull();
      expect(short.problem).toBe('Доступно лише 140 крихт');
    });

    it('says so when the nickname is no longer there', async () => {
      members.findVisibleByNicknames.mockResolvedValue([]);
      found([line()]);

      const [view] = await service.queue();

      expect(view.problem).toMatch(/прихований або не існує/);
    });

    it('names the problem of a line whose account no longer holds the nickname', async () => {
      users.nicknamesOf.mockResolvedValue(new Map([['anya', 'Інша']]));
      found([line(), line({ _id: new Types.ObjectId(), isOrder: true })]);

      const [crumbs, order] = await service.queue();

      for (const view of [crumbs, order]) {
        expect(view.estimate).toBeNull();
        expect(view.problem).toBe(
          'Нікнейм «Аня» більше не прив’язаний до акаунта anya',
        );
      }
    });

    it('asks only for the accounts of the open lines', async () => {
      found([
        line(),
        line({
          _id: new Types.ObjectId(),
          username: 'old',
          status: REQUEST_STATUS.DONE,
          closedDay: '2027-10-02',
        }),
      ]);

      await service.queue();

      expect(users.nicknamesOf).toHaveBeenCalledWith(['anya']);
    });

    it('does not price an order, whose sum was written in hryvnias', async () => {
      found([line({ isOrder: true, crumbs: undefined, amountKop: 5000 })]);

      const [view] = await service.queue();

      expect(view.estimate).toBeNull();
      expect(view.amountKop).toBe(5000);
    });
  });

  describe('fulfil crumbs', () => {
    beforeEach(() => {
      byId(line());
      claimed(line());
    });

    it('takes the crumbs from the oldest season first and pays each part at its own coefficient', async () => {
      await service.fulfil(String(requestId), {}, boss);

      expect(
        members.changeCoins.mock.calls.map(([nickname, change]) => [
          nickname,
          change.season,
          change.delta,
          change.actor,
        ]),
      ).toEqual([
        ['Аня', SEASON.WINTER, -40, boss],
        ['Аня', SEASON.SPRING, -20, boss],
      ]);

      const written = budget.insertEntries.mock.calls[0][0] as ExpenseEntry[];

      expect(written).toEqual([
        expect.objectContaining({
          type: ENTRY_TYPE.EXPENSE,
          kind: EXPENSE_KIND.CARD,
          section: EXPENSE_SECTION.CRUMBS,
          amountKop: 8000,
          crumbs: 40,
          coefficient: 2,
          crumbSeason: SEASON.WINTER,
          crumbYear: 2027,
          nickname: 'Аня',
          date: '2027-10-05',
          season: SEASON.FALL,
          year: 2027,
          createdBy: boss,
          requestId: String(requestId),
        }),
        expect.objectContaining({
          amountKop: 7000,
          crumbs: 20,
          coefficient: 3.5,
          crumbSeason: SEASON.SPRING,
        }),
      ]);
    });

    it('fixes the sums in the request and keeps only the last digits of the card', async () => {
      await service.fulfil(String(requestId), {}, boss);

      const [filter, update] = requests.findOneAndUpdate.mock.calls[0] as any[];

      expect(filter).toEqual({ _id: requestId, status: REQUEST_STATUS.OPEN });
      expect(update.$set).toMatchObject({
        status: REQUEST_STATUS.DONE,
        closedBy: boss,
        closedDay: '2027-10-05',
        paidKop: 15000,
        requisite: '•••• 1111',
      });
      expect(update.$set.parts).toHaveLength(2);

      const everything = JSON.stringify([
        budget.insertEntries.mock.calls,
        budget.commit.mock.calls.map(([, , description]) => description),
        rowsOfCommit,
      ]);

      expect(everything).not.toContain('4111');
    });

    it('audits one operation, with a crumbs row for each season and the entry it belongs to', async () => {
      await service.fulfil(String(requestId), {}, boss);

      const [kind, actor, description] = budget.commit.mock.calls[0];

      expect([kind, actor]).toEqual([AUDIT_KIND.REQUEST_FULFILLED, boss]);
      expect(description).toMatch(/Аня.*На карту.*60 крихт.*150,00 грн/s);
      expect(rowsOfCommit).toHaveLength(2);
      expect(rowsOfCommit[0]).toMatchObject({
        operationId: 'op',
        unit: 'crumbs',
        subjectKey: 'crumbs:аня',
        deltaCrumbs: -40,
        season: SEASON.WINTER,
        year: 2027,
        balanceAfterCrumbs: 185,
        seasonBalanceAfterCrumbs: 60,
      });
      expect(rowsOfCommit[0].before).toMatchObject({
        type: 'member',
        coins: 225,
      });
      expect(rowsOfCommit[0].after).toMatchObject({
        type: 'member',
        coins: 185,
      });
      expect(rowsOfCommit[1]).toMatchObject({
        deltaCrumbs: -20,
        season: SEASON.SPRING,
      });
      expect(rowsOfCommit[1].entryId).toBe(
        String((budget.insertEntries.mock.calls[0][0] as any[])[1]._id),
      );
    });

    it('gives the money to the team as a lisodar when the request is for the development of the team', async () => {
      byId(
        line({
          kind: EXPENSE_KIND.DEVELOPMENT,
          requisite: undefined,
          crumbs: 10,
        }),
      );
      claimed(line({ kind: EXPENSE_KIND.DEVELOPMENT, requisite: undefined }));

      await service.fulfil(String(requestId), {}, boss);

      const [entry] = budget.insertEntries.mock.calls[0][0] as ExpenseEntry[];

      expect(entry).toMatchObject({
        kind: EXPENSE_KIND.DEVELOPMENT,
        amountKop: 2000,
      });
      expect(entry).not.toHaveProperty('requisite');
    });

    it('refuses when the seasons cannot give that many crumbs, and writes nothing', async () => {
      byId(line({ crumbs: 500 }));

      await expect(service.fulfil(String(requestId), {}, boss)).rejects.toThrow(
        /доступно 140, потрібно 500/,
      );
      expect(members.changeCoins).not.toHaveBeenCalled();
      expect(requests.findOneAndUpdate).not.toHaveBeenCalled();
      expect(budget.insertEntries).not.toHaveBeenCalled();
    });

    it('refuses a nickname that is hidden', async () => {
      members.findByNickname.mockResolvedValue(
        member({ deletedAt: new Date() }),
      );

      await expect(service.fulfil(String(requestId), {}, boss)).rejects.toThrow(
        /прихований або не існує/,
      );
    });

    it('refuses a line whose account no longer holds the nickname, and writes nothing', async () => {
      users.nicknamesOf.mockResolvedValue(new Map([['anya', undefined]]));

      await expect(service.fulfil(String(requestId), {}, boss)).rejects.toThrow(
        'Нікнейм «Аня» більше не прив’язаний до акаунта anya: відхиліть запит',
      );
      expect(members.changeCoins).not.toHaveBeenCalled();
      expect(requests.findOneAndUpdate).not.toHaveBeenCalled();
      expect(budget.insertEntries).not.toHaveBeenCalled();
    });

    it('refuses a line whose account is gone', async () => {
      users.nicknamesOf.mockResolvedValue(new Map());

      await expect(service.fulfil(String(requestId), {}, boss)).rejects.toThrow(
        ConflictException,
      );
    });

    it('leaves the dust of a season with the nickname instead of paying nothing for it', async () => {
      byId(line({ crumbs: 40.001 }));

      await service.fulfil(String(requestId), {}, boss);

      expect(members.changeCoins).toHaveBeenCalledTimes(1);
      expect(members.changeCoins.mock.calls[0][1]).toMatchObject({
        season: SEASON.WINTER,
        delta: -40,
      });

      const written = budget.insertEntries.mock.calls[0][0] as ExpenseEntry[];

      expect(written).toHaveLength(1);
      expect(written[0].amountKop).toBe(8000);
    });

    it('refuses a sum below a kopiyka', async () => {
      byId(line({ crumbs: 0.001 }));
      budget.seasonRates.mockResolvedValue([
        { season: SEASON.WINTER, year: 2027, coefficient: 0.0001 },
      ]);

      await expect(service.fulfil(String(requestId), {}, boss)).rejects.toThrow(
        'Сума виплати менша за копійку',
      );
    });

    it('answers 409 for a line that is already closed, and 404 for an unknown one', async () => {
      byId(line({ status: REQUEST_STATUS.DONE }));
      await expect(service.fulfil(String(requestId), {}, boss)).rejects.toThrow(
        'Запит уже закрито',
      );

      byId(null);
      await expect(service.fulfil(String(requestId), {}, boss)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does not touch the crumbs when somebody closed the line first', async () => {
      claimed(null);

      await expect(service.fulfil(String(requestId), {}, boss)).rejects.toThrow(
        'Запит уже закрито',
      );
      expect(members.changeCoins).not.toHaveBeenCalled();
      expect(budget.insertEntries).not.toHaveBeenCalled();
    });

    it('puts everything back when the crumbs of a later season are refused', async () => {
      members.changeCoins
        .mockResolvedValueOnce({
          nickname: 'Аня',
          season: SEASON.WINTER,
          year: 2027,
          delta: -40,
          coins: 185,
          seasonCoins: 0,
        } as any)
        .mockRejectedValueOnce(new ConflictException('Недостатньо крихт'));

      await expect(service.fulfil(String(requestId), {}, boss)).rejects.toThrow(
        'Недостатньо крихт',
      );

      expect(members.changeCoins.mock.calls[2]).toEqual([
        'Аня',
        { season: SEASON.WINTER, year: 2027, delta: 40, actor: boss },
        { guard: false },
      ]);
      expect(budget.insertEntries).not.toHaveBeenCalled();
      expect(budget.removeByRequest).toHaveBeenCalledWith(String(requestId));

      const [, reopen] = requests.updateOne.mock.calls[0] as any[];

      expect(reopen.$set).toMatchObject({
        status: REQUEST_STATUS.OPEN,
        requisite: CARD,
      });
    });

    it('keeps the line closed and the payouts when the crumbs cannot be put back, and says which', async () => {
      members.changeCoins
        .mockResolvedValueOnce({
          nickname: 'Аня',
          season: SEASON.WINTER,
          year: 2027,
          delta: -40,
          coins: 185,
          seasonCoins: 0,
        } as any)
        .mockRejectedValueOnce(new ConflictException('Недостатньо крихт'))
        .mockRejectedValueOnce(new Error('mongo'));

      const failure = service.fulfil(String(requestId), {}, boss);

      await expect(failure).rejects.toThrow(InternalServerErrorException);
      await expect(failure).rejects.toThrow(
        /Не вдалося повернути крихти Аня: .* 40\. Запит лишено закритим/,
      );
      expect(budget.removeByRequest).not.toHaveBeenCalled();
      expect(requests.updateOne).not.toHaveBeenCalled();
    });

    it('keeps the line closed when the payouts cannot be removed', async () => {
      budget.insertEntries.mockRejectedValue(new Error('disk'));
      budget.removeByRequest.mockRejectedValue(new Error('mongo'));

      await expect(service.fulfil(String(requestId), {}, boss)).rejects.toThrow(
        'Не вдалося прибрати виплати запиту',
      );
      expect(requests.updateOne).not.toHaveBeenCalled();
    });

    it('puts the crumbs back and opens the line again when the records cannot be written', async () => {
      budget.insertEntries.mockRejectedValue(new Error('disk'));

      await expect(service.fulfil(String(requestId), {}, boss)).rejects.toThrow(
        'disk',
      );

      const undone = members.changeCoins.mock.calls.slice(2);

      expect(undone.map(([, change]) => [change.season, change.delta])).toEqual(
        [
          [SEASON.SPRING, 20],
          [SEASON.WINTER, 40],
        ],
      );
      expect(requests.updateOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('fulfil an order', () => {
    const order = (extra: Partial<WithdrawalRequest> = {}) =>
      line({
        isOrder: true,
        crumbs: undefined,
        amountKop: 50000,
        projectId: 'p1',
        title: 'Вітробой',
        ...extra,
      });

    beforeEach(() => {
      byId(order());
      claimed(order());
    });

    it('refuses a line whose account no longer holds the nickname', async () => {
      users.nicknamesOf.mockResolvedValue(new Map([['anya', 'Інша']]));

      await expect(service.fulfil(String(requestId), {}, boss)).rejects.toThrow(
        /більше не прив’язаний до акаунта anya/,
      );
      expect(budget.insertEntries).not.toHaveBeenCalled();
    });

    it('pays out of the budget of the title, and the crumbs are not touched', async () => {
      await service.fulfil(String(requestId), {}, boss);

      const [entry] = budget.insertEntries.mock.calls[0][0] as ExpenseEntry[];

      expect(members.changeCoins).not.toHaveBeenCalled();
      expect(entry).toMatchObject({
        section: EXPENSE_SECTION.ORDERS,
        kind: EXPENSE_KIND.CARD,
        amountKop: 50000,
        projectId: 'p1',
        title: 'Вітробой',
        nickname: 'Аня',
        requisite: '•••• 1111',
        requestId: String(requestId),
        createdBy: boss,
      });
      expect(budget.commit.mock.calls[0][2]).toMatch(
        /на тістечка.*500,00 грн/s,
      );
      expect(rowsOfCommit).toEqual([]);
    });

    it('takes the sum the admin corrected it to', async () => {
      await service.fulfil(String(requestId), { amountKop: 40000 }, boss);

      const [entry] = budget.insertEntries.mock.calls[0][0] as ExpenseEntry[];
      const [, update] = requests.findOneAndUpdate.mock.calls[0] as any[];

      expect(entry.amountKop).toBe(40000);
      expect(update.$set.paidKop).toBe(40000);
    });

    it('opens the line again when the records cannot be written', async () => {
      budget.insertEntries.mockRejectedValue(new Error('disk'));

      await expect(service.fulfil(String(requestId), {}, boss)).rejects.toThrow(
        'disk',
      );
      expect(requests.updateOne).toHaveBeenCalledTimes(1);
      expect(members.changeCoins).not.toHaveBeenCalled();
    });
  });
});
