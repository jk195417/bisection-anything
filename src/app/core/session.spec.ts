import { createSession, parseItems, parseSession, shuffle } from './session';
import { decodeSession, encodeSession } from './share-codec';

describe('parseItems', () => {
  it('trims lines and drops blanks and duplicates', () => {
    expect(parseItems(' 拉麵 \n\n壽司\r\n拉麵\n  \n咖哩')).toEqual({
      items: ['拉麵', '壽司', '咖哩'],
      duplicates: ['拉麵'],
    });
  });
});

describe('parseSession', () => {
  it('accepts a valid session', () => {
    const session = { ...createSession('午餐', 'insertion', ['a', 'b']) };
    session.picks = [1];
    expect(parseSession(JSON.parse(JSON.stringify(session)))).toEqual(session);
  });

  it('rejects malformed data', () => {
    const valid = createSession('t', 'elimination', ['a']);
    expect(() => parseSession(null)).toThrow();
    expect(() => parseSession({ ...valid, version: 2 })).toThrow();
    expect(() => parseSession({ ...valid, mode: 'swiss' })).toThrow();
    expect(() => parseSession({ ...valid, items: [1] })).toThrow();
    expect(() => parseSession({ ...valid, picks: [2] })).toThrow();
  });
});

describe('shuffle', () => {
  it('returns a permutation without changing the input', () => {
    const input = [1, 2, 3, 4, 5];
    const output = shuffle(input, () => 0);
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect(output).toEqual([2, 3, 4, 5, 1]);
  });
});

describe('share codec', () => {
  it('round-trips a session through a URL-safe string', async () => {
    const session = createSession('最好吃的拉麵', 'elimination', [
      '一蘭',
      '一風堂',
      'Ramen 🍜',
    ]);
    session.picks = [0, 1];
    const code = await encodeSession(session);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decodeSession(code)).toEqual(session);
  });

  it('rejects garbage', async () => {
    await expect(decodeSession('not*base64')).rejects.toThrow();
    await expect(decodeSession('AAAA')).rejects.toThrow();
  });
});
