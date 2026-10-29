import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { isValidObjectId, Model, Types } from 'mongoose';
import type { IMember } from '../members/interfaces/members.interface.js';
import { MembersService } from '../members/members.service.js';
import {
  seasonOfDay,
  seasonOrdinal,
  seasonStartDay,
  todayInKyiv,
} from '../projects/layout.js';
import type { ValidatedUser } from '../users/interfaces/user.interface.js';
import { UsersService } from '../users/users.service.js';
import { BudgetService } from './budget.service.js';
import {
  created,
  formatCrumbs,
  formatKop,
  round3,
  seasonLabel,
  titleKey,
} from './calc.js';
import { keepRequisite } from './card.js';
import { type CrumbsChange, crumbRow, memberSnapshot } from './crumbs.js';
import type { CreateRequestData, FulfilRequestData } from './data/index.js';
import {
  AUDIT_KIND,
  ENTRY_TYPE,
  EXPENSE_KIND,
  EXPENSE_SECTION,
  KIND_LABEL,
  REQUEST_STATUS,
} from './enums/index.js';
import type {
  ExpenseEntry,
  MyWithdrawal,
  NewAuditRow,
  OperationHead,
  PreviewLine,
  RequestEstimate,
  RequestPreview,
  RequestView,
  SeasonRate,
  SeasonShare,
  TitleLine,
  WithdrawalInfo,
  WithdrawalPart,
  WithdrawalRequest,
} from './interfaces/index.js';
import { paidOf, planWithdrawal, sharesOf, totalCrumbs } from './withdrawal.js';

// What the requests of the nicknames in hand need to know about the crumbs.
// `holders` is the nickname each account holds now: a request is only as good
// as the account that made it still having that nickname.
interface Ledger {
  rates: SeasonRate[];
  orders: TitleLine[];
  members: Map<string, IMember>;
  reserved: Map<string, number>;
  holders: Map<string, string | undefined>;
  today: string;
}

interface Annotation {
  estimate: RequestEstimate | null;
  problem: string | null;
}

const NO_NICKNAME =
  'Вивести можна лише з нікнеймом команди: попросіть адміна прив’язати його в Налаштуваннях';

const lostNickname = ({ username, nickname }: WithdrawalRequest) =>
  `Нікнейм «${nickname}» більше не прив’язаний до акаунта ${username}`;

// The account in hand is the one that asks, so what it holds is known
const holderOf = ({ username, nickname }: ValidatedUser) =>
  new Map([[username, nickname]]);

// What of the shares is left after some parts were taken
const withoutParts = (
  shares: SeasonShare[],
  parts: WithdrawalPart[],
): SeasonShare[] =>
  shares.map((share) => {
    const part = parts.find(
      ({ season, year }) => season === share.season && year === share.year,
    );

    return part
      ? { ...share, crumbs: round3(share.crumbs - part.crumbs) }
      : share;
  });

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    @Inject('BUDGET_REQUEST_MODEL')
    private readonly requestModel: Model<WithdrawalRequest>,
    private readonly budget: BudgetService,
    private readonly members: MembersService,
    private readonly users: UsersService,
  ) {}

  async mine(user: ValidatedUser): Promise<MyWithdrawal> {
    const today = todayInKyiv();
    const requests = await this.requestModel
      .find({ username: user.username, ...this.visibleSince(today) })
      .sort({ createdAt: -1, _id: -1 })
      .lean<WithdrawalRequest[]>();

    if (!user.nickname) {
      return {
        ...this.infoOf(null, null, 0, [], today),
        requests: requests.map((request) =>
          this.view(request, { estimate: null, problem: null }),
        ),
      };
    }

    const ledger = await this.ledgerOf([user.nickname], today, holderOf(user));
    const info = this.infoOf(
      user.nickname,
      ledger.members.get(user.nickname) ?? null,
      ledger.reserved.get(user.nickname) ?? 0,
      ledger.rates,
      today,
    );

    return {
      ...info,
      requests: requests.map((request) =>
        this.view(request, this.annotate(request, ledger)),
      ),
    };
  }

  async preview(
    user: ValidatedUser,
    data: CreateRequestData,
  ): Promise<RequestPreview> {
    const { info, lines, problem } = await this.check(user, data);

    return { info, lines, problem };
  }

  create(user: ValidatedUser, data: CreateRequestData): Promise<RequestView[]> {
    return this.budget.exclusive(async () => {
      const { problem, order } = await this.check(user, data);

      if (problem) throw new ConflictException(problem);

      const groupId = randomUUID();
      const docs = data.lines.map((line) => ({
        status: REQUEST_STATUS.OPEN,
        username: user.username,
        nickname: user.nickname,
        groupId,
        kind: line.kind,
        isOrder: data.isOrder,
        ...(data.isOrder
          ? {
              amountKop: line.amountKop,
              ...(order?.projectId && { projectId: order.projectId }),
              title: order?.title,
            }
          : { crumbs: line.crumbs }),
        ...(line.kind !== EXPENSE_KIND.DEVELOPMENT &&
          line.requisite && { requisite: line.requisite }),
        ...(data.comment && { comment: data.comment }),
      }));
      const saved = await this.requestModel.insertMany(docs);

      return saved.map((doc) =>
        this.view(doc.toObject() as WithdrawalRequest, {
          estimate: null,
          problem: null,
        }),
      );
    });
  }

  cancel(user: ValidatedUser, id: string): Promise<RequestView> {
    return this.budget.exclusive(async () => {
      const request = await this.findOpen(id);

      if (request.username !== user.username) {
        throw new ForbiddenException('Це запит іншого користувача');
      }

      return this.close(request, REQUEST_STATUS.CANCELLED, user.username);
    });
  }

  reject(id: string, actor: string): Promise<RequestView> {
    return this.budget.exclusive(async () =>
      this.close(await this.findOpen(id), REQUEST_STATUS.REJECTED, actor),
    );
  }

  // Open lines, and the ones closed in the current season
  async queue(): Promise<RequestView[]> {
    const today = todayInKyiv();
    const requests = await this.requestModel
      .find(this.visibleSince(today))
      .sort({ createdAt: -1, _id: -1 })
      .lean<WithdrawalRequest[]>();
    const nicknames = [
      ...new Set(
        requests
          .filter(
            ({ status, isOrder }) => status === REQUEST_STATUS.OPEN && !isOrder,
          )
          .map(({ nickname }) => nickname),
      ),
    ];
    const holders = await this.users.nicknamesOf([
      ...new Set(
        requests
          .filter(({ status }) => status === REQUEST_STATUS.OPEN)
          .map(({ username }) => username),
      ),
    ]);
    const ledger = await this.ledgerOf(nicknames, today, holders);

    return requests.map((request) =>
      this.view(request, this.annotate(request, ledger), true),
    );
  }

  fulfil(
    id: string,
    { amountKop }: FulfilRequestData,
    actor: string,
  ): Promise<RequestView> {
    return this.budget.exclusive(async () => {
      const request = await this.findOpen(id);
      const holders = await this.users.nicknamesOf([request.username]);

      if (holders.get(request.username) !== request.nickname) {
        throw new ConflictException(
          `${lostNickname(request)}: відхиліть запит`,
        );
      }

      if (request.isOrder) {
        await this.payOrder(
          request,
          amountKop ?? request.amountKop ?? 0,
          actor,
        );
      } else {
        await this.payCrumbs(request, actor);
      }

      const done = await this.requestModel
        .findById(request._id)
        .lean<WithdrawalRequest>();

      return this.view(done ?? request, { estimate: null, problem: null });
    });
  }

  // Takes the crumbs from the oldest seasons first, pays each part at the
  // coefficient of its season, and fixes all of it in the request
  private async payCrumbs(request: WithdrawalRequest, actor: string) {
    const today = todayInKyiv();
    const { nickname, kind } = request;
    const member = await this.members.findByNickname(nickname);

    if (!member || member.deletedAt) {
      throw new ConflictException(
        `Нікнейм «${nickname}» прихований або не існує`,
      );
    }

    const shares = sharesOf(
      member.seasons,
      await this.budget.seasonRates(),
      today,
    );
    const wanted = request.crumbs ?? 0;
    const { parts, missingCrumbs } = planWithdrawal(wanted, shares);

    if (missingCrumbs > 0) {
      throw new ConflictException(
        `Недостатньо крихт для виводу: доступно ${formatCrumbs(wanted - missingCrumbs)}, потрібно ${formatCrumbs(wanted)}`,
      );
    }

    const paidKop = paidOf(parts);

    if (paidKop < 1) {
      throw new ConflictException('Сума виплати менша за копійку');
    }

    const requestId = String(request._id);
    const { season, year } = seasonOfDay(today);
    const entries: ExpenseEntry[] = parts.map((part) => ({
      _id: new Types.ObjectId(),
      type: ENTRY_TYPE.EXPENSE,
      kind,
      section: EXPENSE_SECTION.CRUMBS,
      amountKop: part.amountKop,
      nickname,
      ...(kind !== EXPENSE_KIND.DEVELOPMENT &&
        request.requisite && { requisite: keepRequisite(request.requisite) }),
      ...(request.comment && { comment: request.comment }),
      crumbs: part.crumbs,
      coefficient: part.coefficient,
      crumbSeason: part.season,
      crumbYear: part.year,
      requestId,
      date: today,
      season,
      year,
      createdBy: actor,
    }));
    const applied: CrumbsChange[] = [];

    await this.budget.commit(
      AUDIT_KIND.REQUEST_FULFILLED,
      actor,
      `Виконано запит: ${nickname} — ${KIND_LABEL[kind]}, ${formatCrumbs(wanted)} крихт → ${formatKop(paidKop)}`,
      entries.map(created),
      async () => {
        const claimed = await this.claim(request, actor, { paidKop, parts });

        try {
          for (const part of parts) {
            applied.push(
              await this.members.changeCoins(nickname, {
                season: part.season,
                year: part.year,
                delta: -part.crumbs,
                actor,
              }),
            );
          }

          await this.budget.insertEntries(entries);
        } catch (error) {
          await this.reopen(claimed, applied, actor, error);

          throw error;
        }

        return applied;
      },
      {
        extraRows: (head, changes) =>
          this.crumbRows(head, member, changes, entries),
      },
    );
  }

  // An order is paid in hryvnias out of the budget of its title and the crumbs
  // stay where they are
  private async payOrder(
    request: WithdrawalRequest,
    amountKop: number,
    actor: string,
  ) {
    const today = todayInKyiv();
    const { nickname, kind } = request;
    const { season, year } = seasonOfDay(today);
    const entry: ExpenseEntry = {
      _id: new Types.ObjectId(),
      type: ENTRY_TYPE.EXPENSE,
      kind,
      section: EXPENSE_SECTION.ORDERS,
      amountKop,
      nickname,
      ...(request.projectId && { projectId: request.projectId }),
      ...(request.title && { title: request.title }),
      ...(kind !== EXPENSE_KIND.DEVELOPMENT &&
        request.requisite && { requisite: keepRequisite(request.requisite) }),
      ...(request.comment && { comment: request.comment }),
      requestId: String(request._id),
      date: today,
      season,
      year,
      createdBy: actor,
    };

    await this.budget.commit(
      AUDIT_KIND.REQUEST_FULFILLED,
      actor,
      `Виконано запит на тістечка: ${nickname} — ${KIND_LABEL[kind]} ${formatKop(amountKop)}, «${request.title ?? ''}»`,
      [created(entry)],
      async () => {
        const claimed = await this.claim(request, actor, {
          paidKop: amountKop,
        });

        try {
          await this.budget.insertEntries([entry]);
        } catch (error) {
          await this.reopen(claimed, [], actor, error);

          throw error;
        }
      },
    );
  }

  // Closing the request first is what keeps a second click from paying twice
  private async claim(
    request: WithdrawalRequest,
    actor: string,
    paid: { paidKop: number; parts?: WithdrawalPart[] },
  ): Promise<WithdrawalRequest> {
    const claimed = await this.requestModel
      .findOneAndUpdate(
        { _id: request._id, status: REQUEST_STATUS.OPEN },
        {
          $set: {
            status: REQUEST_STATUS.DONE,
            closedAt: new Date(),
            closedBy: actor,
            closedDay: todayInKyiv(),
            ...paid,
            ...(request.requisite && {
              requisite: keepRequisite(request.requisite),
            }),
          },
        },
        { new: false },
      )
      .lean<WithdrawalRequest>();

    if (!claimed) throw new ConflictException('Запит уже закрито');

    return claimed;
  }

  // Puts back what a failed fulfilment had already done. When the crumbs or the
  // payouts cannot be put back the line stays closed: opening it again would
  // let the crumbs be taken, or paid, a second time.
  private async reopen(
    request: WithdrawalRequest,
    applied: CrumbsChange[],
    actor: string,
    cause: unknown,
  ) {
    const log = (what: string) => (error: unknown) =>
      this.logger.error(`Не вдалося скасувати: ${what}`, error);
    const lost: CrumbsChange[] = [];

    for (const change of [...applied].reverse()) {
      try {
        await this.members.changeCoins(
          change.nickname,
          {
            season: change.season,
            year: change.year,
            delta: -change.delta,
            actor,
          },
          { guard: false },
        );
      } catch (error) {
        log('повернення крихт')(error);
        lost.push(change);
      }
    }

    if (lost.length > 0) {
      const seasons = lost.map(
        ({ season, year, delta }) =>
          `${seasonLabel(season, year)} ${formatCrumbs(-delta)}`,
      );

      this.logger.error('Запит виконано не до кінця', cause);

      throw new InternalServerErrorException(
        `Не вдалося повернути крихти ${request.nickname}: ${seasons.join(', ')}. Запит лишено закритим, поверніть крихти вручну в «Рейтингу»`,
      );
    }

    try {
      await this.budget.removeByRequest(String(request._id));
    } catch (error) {
      log('видалення виплат')(error);
      this.logger.error('Запит виконано не до кінця', cause);

      throw new InternalServerErrorException(
        'Не вдалося прибрати виплати запиту. Запит лишено закритим, перевірте журнал',
      );
    }

    await this.requestModel
      .updateOne(
        { _id: request._id },
        {
          $set: {
            status: REQUEST_STATUS.OPEN,
            ...(request.requisite && { requisite: request.requisite }),
          },
          $unset: {
            closedAt: 1,
            closedBy: 1,
            closedDay: 1,
            paidKop: 1,
            parts: 1,
          },
        },
      )
      .catch(log('відкриття запиту'));
  }

  private crumbRows(
    head: OperationHead,
    member: IMember,
    changes: CrumbsChange[],
    entries: ExpenseEntry[],
  ): NewAuditRow[] {
    const seasons = (member.seasons ?? []).map(({ season, year, coins }) => ({
      season,
      year,
      coins,
    }));
    let coins = member.coins ?? 0;
    const snapshot = () =>
      memberSnapshot({ nickname: member.nickname, coins, seasons });

    return changes.map((change, index) => {
      const before = snapshot();
      const counter = seasons.find(
        ({ season, year }) => season === change.season && year === change.year,
      );

      coins = change.coins;

      if (counter) counter.coins = change.seasonCoins;

      return crumbRow(head, {
        change,
        entryId: String(entries[index]._id),
        before,
        after: snapshot(),
      });
    });
  }

  // The same look at a request for the form that asks and for the save that
  // follows it, so the one cannot promise what the other refuses
  private async check(user: ValidatedUser, data: CreateRequestData) {
    const today = todayInKyiv();
    const { nickname } = user;
    const ledger = await this.ledgerOf(
      nickname ? [nickname] : [],
      today,
      holderOf(user),
    );
    const member = nickname ? (ledger.members.get(nickname) ?? null) : null;
    const info = this.infoOf(
      nickname ?? null,
      member,
      nickname ? (ledger.reserved.get(nickname) ?? 0) : 0,
      ledger.rates,
      today,
    );
    const fail = (problem: string) => ({
      info,
      lines: [] as PreviewLine[],
      problem,
      order: null,
    });

    if (!nickname) return fail(NO_NICKNAME);

    if (!member)
      return fail(`Нікнейм «${nickname}» не знайдено серед учасників`);

    if (data.isOrder) return this.checkOrder(data, info, ledger.orders);

    const asked = round3(
      data.lines.reduce((total, { crumbs }) => total + (crumbs ?? 0), 0),
    );
    let left = sharesOf(member.seasons, ledger.rates, today);
    const lines = data.lines.map(({ kind, crumbs }): PreviewLine => {
      const { parts, missingCrumbs } = planWithdrawal(crumbs ?? 0, left);

      left = withoutParts(left, parts);

      return {
        kind,
        crumbs,
        estimate:
          missingCrumbs > 0 ? null : { amountKop: paidOf(parts), parts },
      };
    });

    if (asked > info.availableCrumbs + 0.0005) {
      return {
        info,
        lines,
        order: null,
        problem:
          info.availableCrumbs > 0
            ? `Для виводу доступно лише ${formatCrumbs(info.availableCrumbs)} крихт, а ви просите ${formatCrumbs(asked)}`
            : 'Зараз немає крихт для виводу: їх можна вивести лише із завершених сезонів, які мають коефіцієнт',
      };
    }

    if (lines.some(({ estimate }) => estimate && estimate.amountKop < 1)) {
      return {
        info,
        lines,
        order: null,
        problem: 'Сума виплати менша за копійку',
      };
    }

    return { info, lines, problem: null, order: null };
  }

  private checkOrder(
    data: CreateRequestData,
    info: WithdrawalInfo,
    orders: TitleLine[],
  ) {
    const key = titleKey({
      projectId: data.projectId ?? undefined,
      title: data.title ?? undefined,
    });
    const budget = orders.find((line) => line.key === key);
    const lines = data.lines.map(
      ({ kind, amountKop }): PreviewLine => ({
        kind,
        amountKop: amountKop ?? undefined,
        estimate: null,
      }),
    );

    if (!budget) {
      return {
        info,
        lines,
        order: null,
        problem: 'Для цього тайтлу ще немає бюджету замовлення',
      };
    }

    const asked = data.lines.reduce(
      (total, { amountKop }) => total + (amountKop ?? 0),
      0,
    );

    return {
      info,
      lines,
      order: budget,
      problem:
        asked > budget.balanceKop
          ? `У бюджеті «${budget.title}» є лише ${formatKop(budget.balanceKop)}, а ви просите ${formatKop(asked)}`
          : null,
    };
  }

  private async ledgerOf(
    nicknames: string[],
    today: string,
    holders: Map<string, string | undefined>,
  ): Promise<Ledger> {
    const [facts, members, reserved] = await Promise.all([
      nicknames.length
        ? this.budget.requestFacts()
        : Promise.resolve({ rates: [], orders: [] }),
      this.members.findVisibleByNicknames(nicknames),
      this.reservedBy(nicknames, holders),
    ]);

    return {
      ...facts,
      members: new Map(members.map((member) => [member.nickname, member])),
      reserved,
      holders,
      today,
    };
  }

  // Crumbs that open requests have already asked for. A line of an account that
  // no longer holds its nickname asks for nothing.
  private async reservedBy(
    nicknames: string[],
    holders: Map<string, string | undefined>,
  ) {
    if (nicknames.length === 0) return new Map<string, number>();

    const groups = await this.requestModel.aggregate<{
      _id: { nickname: string; username: string };
      crumbs: number;
    }>([
      {
        $match: {
          nickname: { $in: nicknames },
          status: REQUEST_STATUS.OPEN,
          isOrder: false,
        },
      },
      {
        $group: {
          _id: { nickname: '$nickname', username: '$username' },
          crumbs: { $sum: '$crumbs' },
        },
      },
    ]);
    const reserved = new Map<string, number>();

    for (const { _id, crumbs } of groups) {
      if (holders.get(_id.username) !== _id.nickname) continue;

      reserved.set(
        _id.nickname,
        round3((reserved.get(_id.nickname) ?? 0) + crumbs),
      );
    }

    return reserved;
  }

  private infoOf(
    nickname: string | null,
    member: IMember | null,
    reserved: number,
    rates: SeasonRate[],
    today: string,
  ): WithdrawalInfo {
    const shares = sharesOf(member?.seasons, rates, today);
    const withdrawable = totalCrumbs(shares);
    const balance = round3(member?.coins ?? 0);

    return {
      nickname,
      balance,
      reservedCrumbs: round3(reserved),
      availableCrumbs: Math.max(0, round3(withdrawable - reserved)),
      lockedCrumbs: Math.max(0, round3(balance - withdrawable)),
      shares,
    };
  }

  // What an open line would be paid right now, each line on its own
  private annotate(request: WithdrawalRequest, ledger: Ledger): Annotation {
    const none = { estimate: null, problem: null };

    if (request.status !== REQUEST_STATUS.OPEN) return none;

    if (ledger.holders.get(request.username) !== request.nickname) {
      return { estimate: null, problem: lostNickname(request) };
    }

    if (request.isOrder) return none;

    const member = ledger.members.get(request.nickname);

    if (!member) {
      return { estimate: null, problem: 'Нікнейм прихований або не існує' };
    }

    const { parts, missingCrumbs } = planWithdrawal(
      request.crumbs ?? 0,
      sharesOf(member.seasons, ledger.rates, ledger.today),
    );

    return missingCrumbs > 0
      ? {
          estimate: null,
          problem: `Доступно лише ${formatCrumbs((request.crumbs ?? 0) - missingCrumbs)} крихт`,
        }
      : { estimate: { amountKop: paidOf(parts), parts }, problem: null };
  }

  // A line stays in the list until the season it was closed in is over
  private visibleSince(today: string) {
    return {
      $or: [
        { status: REQUEST_STATUS.OPEN },
        { closedDay: { $gte: seasonStartDay(seasonOrdinal(today)) } },
      ],
    };
  }

  // The full number of a card is for the admin who pays it, and only until it
  // is paid
  private view(
    request: WithdrawalRequest,
    { estimate, problem }: Annotation,
    showRequisite = false,
  ): RequestView {
    const { requisite } = request;
    const isOpen = request.status === REQUEST_STATUS.OPEN;

    return {
      _id: String(request._id),
      groupId: request.groupId,
      status: request.status,
      username: request.username,
      nickname: request.nickname,
      kind: request.kind,
      isOrder: request.isOrder,
      ...(request.crumbs !== undefined && { crumbs: request.crumbs }),
      ...(request.amountKop !== undefined && { amountKop: request.amountKop }),
      ...(request.projectId && { projectId: request.projectId }),
      ...(request.title && { title: request.title }),
      ...(requisite && {
        requisite:
          showRequisite && isOpen ? requisite : keepRequisite(requisite),
      }),
      ...(request.comment && { comment: request.comment }),
      ...(request.createdAt && { createdAt: request.createdAt }),
      ...(request.closedAt && { closedAt: request.closedAt }),
      ...(request.closedBy && { closedBy: request.closedBy }),
      ...(request.paidKop !== undefined && { paidKop: request.paidKop }),
      ...(request.parts?.length && { parts: request.parts }),
      estimate,
      problem,
    };
  }

  private async findOpen(id: string): Promise<WithdrawalRequest> {
    if (!isValidObjectId(id)) throw new NotFoundException('Запит не знайдено');

    const request = await this.requestModel
      .findById(id)
      .lean<WithdrawalRequest>();

    if (!request) throw new NotFoundException('Запит не знайдено');

    if (request.status !== REQUEST_STATUS.OPEN) {
      throw new ConflictException('Запит уже закрито');
    }

    return request;
  }

  private async close(
    request: WithdrawalRequest,
    status: REQUEST_STATUS,
    actor: string,
  ): Promise<RequestView> {
    const closed = await this.requestModel
      .findOneAndUpdate(
        { _id: request._id, status: REQUEST_STATUS.OPEN },
        {
          $set: {
            status,
            closedAt: new Date(),
            closedBy: actor,
            closedDay: todayInKyiv(),
            ...(request.requisite && {
              requisite: keepRequisite(request.requisite),
            }),
          },
        },
        { new: true },
      )
      .lean<WithdrawalRequest>();

    if (!closed) throw new ConflictException('Запит уже закрито');

    return this.view(closed, { estimate: null, problem: null });
  }
}
