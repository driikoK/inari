import { plural } from './utils.js';

describe('plural', () => {
  const forms: [string, string, string] = ['трек', 'треки', 'треків'];

  it.each([
    [0, 'треків'],
    [1, 'трек'],
    [2, 'треки'],
    [4, 'треки'],
    [5, 'треків'],
    [11, 'треків'],
    [12, 'треків'],
    [14, 'треків'],
    [21, 'трек'],
    [22, 'треки'],
    [111, 'треків'],
    [101, 'трек'],
  ])('puts %i in the form «%s»', (count, form) => {
    expect(plural(count, forms)).toBe(form);
  });
});
