import { resolve } from 'node:path';
import { vi } from 'vitest';

import configuration from './configuration.js';

describe('configuration (posters)', () => {
  beforeEach(() => {
    vi.stubEnv('POSTERS_DIR', '');
    vi.stubEnv('POSTERS_URL', '');
    vi.stubEnv('PORT', '');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('keeps the posters in uploads/posters under the working directory by default', () => {
    expect(configuration().posters.dir).toBe(resolve('uploads/posters'));
  });

  it('makes a relative folder absolute, the static plugin refuses a relative root', () => {
    vi.stubEnv('POSTERS_DIR', 'files/posters');

    expect(configuration().posters.dir).toBe(resolve('files/posters'));
  });

  it('takes an absolute folder as it is', () => {
    vi.stubEnv('POSTERS_DIR', resolve('/srv/posters'));

    expect(configuration().posters.dir).toBe(resolve('/srv/posters'));
  });

  it('builds the default address from the port the API listens on', () => {
    expect(configuration().posters.url).toBe('http://localhost:8000/posters');

    vi.stubEnv('PORT', '3000');

    expect(configuration().posters.url).toBe('http://localhost:3000/posters');
  });

  it('takes POSTERS_URL as given, without a slash at the end', () => {
    vi.stubEnv('POSTERS_URL', 'https://api.example.com/posters///');

    expect(configuration().posters.url).toBe('https://api.example.com/posters');
  });
});
