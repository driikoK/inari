import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { ProposalsController } from './proposals.controller.js';

const guardsOf = (handler: (...args: any[]) => unknown): unknown[] =>
  Reflect.getMetadata('__guards__', handler) ?? [];

describe('ProposalsController', () => {
  it.each([
    'createSeason',
    'setSeasonState',
    'deleteSeason',
    'createProposal',
    'updateProposal',
    'deleteProposal',
    'setParticipantRoles',
  ] as const)('%s is for admins only', (handler) => {
    expect(guardsOf(ProposalsController.prototype[handler])).toEqual([
      AuthGuard,
      AdminGuard,
    ]);
  });

  it.each(['findAll', 'join'] as const)(
    '%s is open to any logged-in user',
    (handler) => {
      expect(guardsOf(ProposalsController.prototype[handler])).toEqual([
        AuthGuard,
      ]);
    },
  );
});
