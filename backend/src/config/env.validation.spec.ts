import { validate } from './env.validation.js';

describe('validate (environment variables)', () => {
  const valid = { JWT_SECRET_KEY: 'secret' };

  it('accepts the minimal environment and returns it unchanged', () => {
    expect(validate(valid)).toEqual(valid);
  });

  it('requires JWT_SECRET_KEY', () => {
    expect(() => validate({})).toThrow(/JWT_SECRET_KEY/);
  });

  it('treats an empty value (`KEY=` in .env) as not set', () => {
    expect(() =>
      validate({ ...valid, PORT: '', MONGO_PORT: '', MONGO_USERNAME: '' }),
    ).not.toThrow();
    expect(() => validate({ JWT_SECRET_KEY: '' })).toThrow(/JWT_SECRET_KEY/);
  });

  it('accepts numeric ports given as strings', () => {
    expect(() =>
      validate({ ...valid, PORT: '8000', MONGO_PORT: '27017' }),
    ).not.toThrow();
  });

  it.each(['abc', '0', '70000', '80.5'])('rejects PORT=%s', (port) => {
    expect(() => validate({ ...valid, PORT: port })).toThrow(/PORT/);
  });

  it('reports every problem at once', () => {
    expect(() => validate({ PORT: 'abc', MONGO_PORT: '0' })).toThrow(
      /JWT_SECRET_KEY[\s\S]*PORT[\s\S]*MONGO_PORT/,
    );
  });

  it('ignores unrelated variables', () => {
    expect(() =>
      validate({ ...valid, PATH: '/usr/bin', SOMETHING_ELSE: 'x' }),
    ).not.toThrow();
  });
});
