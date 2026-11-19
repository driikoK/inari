import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CodexController } from './codex.controller.js';

const guardsOf = (handler: (...args: any[]) => unknown): unknown[] =>
  Reflect.getMetadata('__guards__', handler) ?? [];

describe('CodexController', () => {
  it('get is for every logged-in user, the Codex is the rules of the whole team', () => {
    expect(guardsOf(CodexController.prototype.get)).toEqual([AuthGuard]);
  });

  it('save is for admins only', () => {
    expect(guardsOf(CodexController.prototype.save)).toEqual([
      AuthGuard,
      AdminGuard,
    ]);
  });
});
