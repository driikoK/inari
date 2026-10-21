import { UsersModule } from './users.module.js';

describe('UsersModule', () => {
  it('is global, because AuthGuard injects UsersService in every module that uses it', () => {
    expect(Reflect.getMetadata('__module:global__', UsersModule)).toBe(true);
  });
});
