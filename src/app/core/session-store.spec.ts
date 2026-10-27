import { TestBed } from '@angular/core/testing';
import { createSession } from './session';
import { SessionStore, STORAGE_KEY } from './session-store';
import { decodeSession } from './share-codec';

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    localStorage.clear();
    store = TestBed.inject(SessionStore);
  });

  it('starts empty without a saved session', () => {
    expect(store.session()).toBeNull();
    expect(store.comparison()).toBeNull();
    expect(store.finished()).toBe(false);
  });

  it('runs an elimination session to the end', () => {
    store.start('t', 'elimination', ['a', 'b', 'c'], false);
    expect(store.comparison()).toEqual({ left: 'b', right: 'c', label: '四強' });
    store.pick(1);
    expect(store.comparison()).toEqual({ left: 'a', right: 'c', label: '決賽' });
    store.pick(1);
    expect(store.finished()).toBe(true);
    expect(store.elimination()?.champion).toBe(2);
    expect(store.progress()).toEqual({ done: 2, total: 2 });

    store.pick(0);
    expect(store.session()?.picks).toEqual([1, 1]);
  });

  it('runs an insertion session and undoes picks', () => {
    store.start('t', 'insertion', ['a', 'b'], false);
    expect(store.comparison()?.left).toBe('b');
    store.pick(0);
    expect(store.insertion()?.ranking).toEqual([1, 0]);
    store.undo();
    expect(store.session()?.picks).toEqual([]);
    expect(store.finished()).toBe(false);
  });

  it('saves to and restores from localStorage', () => {
    store.start('t', 'insertion', ['a', 'b'], false);
    store.pick(1);
    TestBed.tick();
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(saved.picks).toEqual([1]);

    TestBed.resetTestingModule();
    expect(TestBed.inject(SessionStore).session()).toEqual(saved);
  });

  it('ignores corrupted storage', () => {
    localStorage.setItem(STORAGE_KEY, '{oops');
    TestBed.resetTestingModule();
    expect(TestBed.inject(SessionStore).session()).toBeNull();
  });

  it('removes the saved session when cleared', () => {
    store.start('t', 'insertion', ['a'], false);
    TestBed.tick();
    store.clear();
    TestBed.tick();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('round-trips through JSON export and import', () => {
    store.start('t', 'elimination', ['a', 'b'], false);
    store.pick(0);
    const json = store.exportJson();
    store.clear();
    store.importJson(json);
    expect(store.session()?.picks).toEqual([0]);
    expect(() => store.importJson('nope')).toThrowError('不是有效的 JSON 檔案');
  });

  it('builds a share link that decodes to the session', async () => {
    const session = createSession('t', 'insertion', ['a', 'b']);
    store.load(session);
    const link = new URL(await store.shareLink());
    expect(link.pathname).toMatch(/\/share$/);
    expect(await decodeSession(link.hash.slice(1))).toEqual(session);
  });
});
