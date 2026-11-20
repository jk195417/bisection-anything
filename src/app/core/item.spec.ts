import { itemName, parseItem } from './item';

describe('parseItem', () => {
  it('keeps plain text as the name', () => {
    expect(parseItem(' 一蘭 ')).toEqual({ name: '一蘭', image: null });
  });

  it('splits a name and an image URL', () => {
    expect(parseItem('一蘭 | https://example.com/ichiran.jpg')).toEqual({
      name: '一蘭',
      image: 'https://example.com/ichiran.jpg',
    });
  });

  it('names a bare image URL after its file', () => {
    expect(parseItem('https://example.com/img/%E4%B8%80%E8%98%AD.png')).toEqual({
      name: '一蘭',
      image: 'https://example.com/img/%E4%B8%80%E8%98%AD.png',
    });
  });

  it('ignores a pipe that is not followed by a URL', () => {
    expect(parseItem('A | B')).toEqual({ name: 'A | B', image: null });
  });
});

describe('itemName', () => {
  it('drops the image URL', () => {
    expect(itemName('一蘭 | https://example.com/a.png')).toBe('一蘭');
  });
});
