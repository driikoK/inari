import { AuthGuard } from '../auth/auth.guard.js';
import { CuratorGuard } from '../auth/curator.guard.js';
import { ProjectsController } from './projects.controller.js';

const guardsOf = (handler: (...args: any[]) => unknown): unknown[] =>
  Reflect.getMetadata('__guards__', handler) ?? [];

describe('ProjectsController', () => {
  it.each(['create', 'update', 'finish', 'reopen', 'remove'] as const)(
    '%s is for curators and admins only',
    (handler) => {
      expect(guardsOf(ProjectsController.prototype[handler])).toEqual([
        AuthGuard,
        CuratorGuard,
      ]);
    },
  );

  it('lets any logged-in user read the layout', () => {
    expect(guardsOf(ProjectsController.prototype.findAll)).toEqual([AuthGuard]);
  });
});
