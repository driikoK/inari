import { AdminGuard } from '../auth/admin.guard.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CuratorGuard } from '../auth/curator.guard.js';
import { TracksController } from './tracks.controller.js';

const guardsOf = (handler: (...args: any[]) => unknown): unknown[] =>
  Reflect.getMetadata('__guards__', handler) ?? [];

describe('TracksController', () => {
  it('addNewTrack is for curators and admins, who add the cookies', () => {
    expect(guardsOf(TracksController.prototype.addNewTrack)).toEqual([
      AuthGuard,
      CuratorGuard,
    ]);
  });

  it.each(['updateTrack', 'deleteTrack'] as const)(
    '%s is for admins only, like the cookie list in the app',
    (handler) => {
      expect(guardsOf(TracksController.prototype[handler])).toEqual([
        AuthGuard,
        AdminGuard,
      ]);
    },
  );

  it.each(['getAllTracks', 'getLastTracksForTitle'] as const)(
    '%s only reads, so any logged-in user may call it',
    (handler) => {
      expect(guardsOf(TracksController.prototype[handler])).toEqual([
        AuthGuard,
      ]);
    },
  );
});
