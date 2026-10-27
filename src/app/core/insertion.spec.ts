import { estimateInsertion, runInsertion } from './insertion';
import { Pick } from './session';

/** Answers every comparison by preferring the smaller of two scores. */
function sortBy(scores: number[]): { ranking: number[]; picks: Pick[] } {
  const picks: Pick[] = [];
  let state = runInsertion(scores.length, picks);
  while (state.current) {
    const { item, against } = state.current;
    picks.push(scores[item] < scores[against] ? 0 : 1);
    state = runInsertion(scores.length, picks);
  }
  return { ranking: state.ranking, picks };
}

describe('runInsertion', () => {
  it('handles empty and single-item lists', () => {
    expect(runInsertion(0, [])).toEqual({
      ranking: [],
      current: null,
      pending: [],
      done: 0,
      total: 0,
    });
    expect(runInsertion(1, []).ranking).toEqual([0]);
  });

  it('first compares the second item against the first', () => {
    expect(runInsertion(3, [])).toEqual({
      ranking: [0],
      current: { item: 1, against: 0 },
      pending: [2],
      done: 0,
      total: 3,
    });
  });

  it('puts a winning item above the item it beat', () => {
    expect(runInsertion(2, [0]).ranking).toEqual([1, 0]);
    expect(runInsertion(2, [1]).ranking).toEqual([0, 1]);
  });

  it('binary searches into the middle of the ranking', () => {
    // After [1, 0], item 2 is compared with the middle (index 1 -> item 0).
    expect(runInsertion(3, [0]).current).toEqual({ item: 2, against: 0 });
  });

  it('sorts any order within the estimated number of comparisons', () => {
    const scores = [7, 3, 9, 1, 8, 2, 6, 4, 5, 0, 10];
    const { ranking, picks } = sortBy(scores);
    expect(ranking.map((it) => scores[it])).toEqual(
      [...scores].sort((a, b) => a - b),
    );
    expect(picks.length).toBeLessThanOrEqual(estimateInsertion(scores.length));
  });
});

describe('estimateInsertion', () => {
  it('sums the worst-case binary search depths', () => {
    expect(estimateInsertion(1)).toBe(0);
    expect(estimateInsertion(2)).toBe(1);
    expect(estimateInsertion(4)).toBe(1 + 2 + 2);
    expect(estimateInsertion(16)).toBe(49);
  });
});
