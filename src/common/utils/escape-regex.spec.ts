import { escapeRegex } from './escape-regex.js';

describe('escapeRegex', () => {
  it('turns user input into a literal pattern', () => {
    const hostile = '(a+)+$ .* [x] \\ ^';
    const regex = new RegExp(escapeRegex(hostile), 'i');
    expect(regex.test(`prefix ${hostile} suffix`)).toBe(true);
    expect(regex.test('aaaa')).toBe(false);
  });

  it('does not throw on unbalanced metacharacters', () => {
    expect(() => new RegExp(escapeRegex('(('))).not.toThrow();
    expect(() => new RegExp(escapeRegex('['))).not.toThrow();
  });
});
