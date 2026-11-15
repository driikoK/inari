import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { MembersService } from '../members/members.service.js';
import { TrackService } from '../tracks/tracks.service.js';
import { BudgetAuditService } from './budget-audit.service.js';
import { BudgetService } from './budget.service.js';
import type {
  BudgetEntry,
  OpeningResult,
  ReconcileReport,
  WithdrawalRequest,
} from './interfaces/index.js';
import { reconcile, unauditedNicknames } from './reconcile.js';

@Injectable()
export class ReconcileService {
  constructor(
    @Inject('BUDGET_ENTRY_MODEL')
    private readonly entryModel: Model<BudgetEntry>,
    @Inject('BUDGET_REQUEST_MODEL')
    private readonly requestModel: Model<WithdrawalRequest>,
    private readonly budget: BudgetService,
    private readonly audit: BudgetAuditService,
    private readonly members: MembersService,
    private readonly tracks: TrackService,
  ) {}

  // Adds everything up again from the records, the audit, the requests, the
  // counters and the tracks, and says where they disagree. It changes nothing.
  // It waits for the money writes in progress, so a record that is saved but
  // not yet audited is not taken for a gap. Crumbs are written outside that
  // queue (tracks, the rating), so a change of crumbs in the middle of a run can
  // show up as a gap until the next one.
  run(): Promise<ReconcileReport> {
    return this.budget.exclusive(async () => {
      const [
        groups,
        entries,
        requests,
        moneyAudit,
        auditedEntryIds,
        crumbAudit,
        crumbRowsOfEntries,
        members,
        earned,
      ] = await Promise.all([
        this.budget.loadGroups(),
        this.entryModel.find().lean<BudgetEntry[]>(),
        this.requestModel.find().lean<WithdrawalRequest[]>(),
        this.audit.moneySums(),
        this.audit.auditedEntryIds(),
        this.audit.crumbSums(),
        this.audit.crumbsOfPayouts(),
        this.members.crumbBalances(),
        this.tracks.getCoinsByNickname(),
      ]);

      return reconcile(
        {
          groups,
          entries,
          requests,
          moneyAudit,
          auditedEntryIds,
          crumbAudit,
          crumbRowsOfEntries,
          members,
          earned,
        },
        new Date(),
      );
    });
  }

  // Gives every nickname with crumbs that nobody has changed since the audit
  // began the opening state its first change would have written
  async writeOpening(actor: string): Promise<OpeningResult> {
    const written: string[] = [];

    for (const nickname of unauditedNicknames(
      await this.members.crumbBalances(),
    )) {
      if (await this.members.auditOpening(nickname, actor)) {
        written.push(nickname);
      }
    }

    return { written };
  }
}
