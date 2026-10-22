import { Injectable } from '@nestjs/common';
import type { SEASON } from '../shared/index.js';
import { BudgetAuditService } from './budget-audit.service.js';
import {
  type CrumbAuditItem,
  type CrumbsOpening,
  crumbRow,
  formatCrumbs,
  openingRow,
} from './crumbs.js';
import { AUDIT_KIND } from './enums/index.js';

@Injectable()
export class CrumbAuditService {
  constructor(private readonly auditService: BudgetAuditService) {}

  // Throws as it is: nothing has changed yet, so the caller can undo its claim
  async recordOpening(
    actor: string,
    nickname: string,
    opening: CrumbsOpening,
    season: SEASON,
    year: number,
  ): Promise<void> {
    const head = this.auditService.operation(
      AUDIT_KIND.CRUMBS_INITIAL,
      actor,
      `Початковий стан: ${nickname} — ${formatCrumbs(opening.coins)} крихт`,
    );

    await this.auditService.record([
      openingRow(head, nickname, opening, season, year),
    ]);
  }

  async record(
    kind: AUDIT_KIND,
    actor: string,
    description: string,
    items: CrumbAuditItem[],
  ): Promise<void> {
    if (items.length === 0) return;

    const head = this.auditService.operation(kind, actor, description);

    await this.auditService.save(items.map((item) => crumbRow(head, item)));
  }
}
