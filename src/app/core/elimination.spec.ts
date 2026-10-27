import { roundLabel, runElimination, seedOrder } from './elimination';
import { Pick } from './session';

describe('seedOrder', () => {
  it('keeps the top seeds apart until the final', () => {
    expect(seedOrder(1)).toEqual([0]);
    expect(seedOrder(2)).toEqual([0, 1]);
    expect(seedOrder(4)).toEqual([0, 3, 1, 2]);
    expect(seedOrder(8)).toEqual([0, 7, 3, 4, 1, 6, 2, 5]);
  });
});

describe('runElimination', () => {
  it('handles empty and single-item brackets', () => {
    expect(runElimination(0, [])).toEqual({
      rounds: [],
      current: null,
      champion: null,
      done: 0,
      total: 0,
    });
    expect(runElimination(1, [])).toMatchObject({
      rounds: [],
      current: null,
      champion: 0,
    });
  });

  it('starts at the first match of a full bracket', () => {
    const state = runElimination(4, []);
    expect(state.rounds.length).toBe(2);
    expect(state.rounds[0]).toEqual([
      { a: 0, b: 3, winner: null, bye: false },
      { a: 1, b: 2, winner: null, bye: false },
    ]);
    expect(state.current).toEqual({ round: 0, match: 0 });
    expect(state.total).toBe(3);
  });

  it('plays matches round by round and crowns the last winner', () => {
    const state = runElimination(4, [1, 0, 0]);
    expect(state.rounds[0].map((it) => it.winner)).toEqual([3, 1]);
    expect(state.rounds[1]).toEqual([{ a: 3, b: 1, winner: 3, bye: false }]);
    expect(state.current).toBeNull();
    expect(state.champion).toBe(3);
    expect(state.done).toBe(3);
  });

  it('gives first-round byes to the top seeds', () => {
    const state = runElimination(5, []);
    const firstRound = state.rounds[0];
    expect(firstRound.length).toBe(4);
    expect(firstRound.filter((it) => it.bye).map((it) => it.winner)).toEqual(
      [0, 1, 2],
    );
    expect(firstRound[1]).toEqual({ a: 3, b: 4, winner: null, bye: false });
    expect(state.current).toEqual({ round: 0, match: 1 });
    expect(state.total).toBe(4);
  });

  it('needs exactly count - 1 picks for any size', () => {
    for (let count = 2; count <= 33; count++) {
      const picks: Pick[] = [];
      let state = runElimination(count, picks);
      while (state.current) {
        picks.push((picks.length % 2) as Pick);
        state = runElimination(count, picks);
      }
      expect(picks.length, `count ${count}`).toBe(count - 1);
      expect(state.champion).not.toBeNull();
    }
  });

  it('only marks first-round matches as byes', () => {
    const state = runElimination(3, []);
    expect(state.rounds[1]).toEqual([
      { a: 0, b: null, winner: null, bye: false },
    ]);
  });

  it('ignores picks beyond the end of the bracket', () => {
    expect(runElimination(2, [1, 0, 0]).champion).toBe(1);
  });
});

describe('roundLabel', () => {
  it('names the last rounds and numbers the rest', () => {
    expect([0, 1, 2, 3, 4].map((it) => roundLabel(it, 5))).toEqual([
      '第 1 輪',
      '第 2 輪',
      '八強',
      '四強',
      '決賽',
    ]);
  });
});
