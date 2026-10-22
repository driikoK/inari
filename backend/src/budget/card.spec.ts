import {
  digitsOf,
  hasCardNumber,
  isCardNumber,
  isHttpsLink,
  isMasked,
  keepRequisite,
  maskCard,
} from './card.js';

const VISA = '4111111111111111';

describe('isCardNumber', () => {
  it.each([
    VISA,
    '4111 1111 1111 1111',
    '4111-1111-1111-1111',
    '5555555555554444',
  ])('accepts %s', (value) => {
    expect(isCardNumber(value)).toBe(true);
  });

  it.each([
    ['one digit mistyped', '4111111111111112'],
    ['too short', '411111111111111'],
    ['too long', '41111111111111111'],
    ['letters', '4111 1111 1111 111a'],
    ['empty', ''],
    ['a link', 'https://send.monobank.ua/jar/abc'],
  ])('refuses %s', (_name, value) => {
    expect(isCardNumber(value)).toBe(false);
  });
});

describe('hasCardNumber', () => {
  it.each([
    VISA,
    'на карту 4111 1111 1111 1111 дякую',
    'https://pay.example/4111111111111111',
    '4111-1111-1111-1111',
  ])('finds a card number in %s', (value) => {
    expect(hasCardNumber(value)).toBe(true);
  });

  it.each([
    'Дякуємо за роботу',
    'https://send.monobank.ua/jar/abc',
    '•••• 1111',
    'замовлення 2024-05-12, 3 серії',
    '4111111111111112',
    '',
  ])('finds nothing in %s', (value) => {
    expect(hasCardNumber(value)).toBe(false);
  });
});

describe('isHttpsLink', () => {
  it('takes a secure link with a host', () => {
    expect(isHttpsLink('https://send.monobank.ua/jar/abc')).toBe(true);
    expect(isHttpsLink('  https://example.com  ')).toBe(true);
  });

  it.each([
    'http://send.monobank.ua/jar/abc',
    'ftp://example.com',
    'javascript:alert(1)',
    'https://localhost',
    'send.monobank.ua',
    '4111111111111111',
    '',
  ])('refuses %s', (value) => {
    expect(isHttpsLink(value)).toBe(false);
  });
});

describe('maskCard and keepRequisite', () => {
  it('keeps the last four digits only', () => {
    expect(maskCard(VISA)).toBe('•••• 1111');
    expect(maskCard('4111 1111 1111 1111')).toBe('•••• 1111');
    expect(digitsOf('4111 1111-1111 1111')).toBe(VISA);
  });

  it('recognises a masked number', () => {
    expect(isMasked('•••• 1111')).toBe(true);
    expect(isMasked(VISA)).toBe(false);
    expect(isMasked('•••• 11')).toBe(false);
  });

  it('masks a card, leaves a link and an already masked number as they are', () => {
    expect(keepRequisite(VISA)).toBe('•••• 1111');
    expect(keepRequisite('https://send.monobank.ua/jar/abc ')).toBe(
      'https://send.monobank.ua/jar/abc',
    );
    expect(keepRequisite('•••• 1111')).toBe('•••• 1111');
  });
});
