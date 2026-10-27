import { Pick } from './session';

export interface InsertionState {
  /** Items placed so far, best first. */
  ranking: number[];
  /** The next comparison: is `item` better than `against`? */
  current: { item: number; against: number } | null;
  /** Items not compared yet, excluding `current.item`. */
  pending: number[];
  done: number;
  /** Expected number of comparisons; exact once finished. */
  total: number;
}

/** Worst-case comparisons to binary-insert into rankings of 1..count-1. */
export function estimateInsertion(count: number): number {
  let total = 0;
  for (let length = 1; length < count; length++) {
    total += Math.ceil(Math.log2(length + 1));
  }
  return total;
}

/**
 * Replays `picks` as a binary insertion sort: each item in turn is
 * compared against the middle of the current ranking until its position
 * is found. Pick 0 means the new item wins, 1 means the ranked item wins.
 */
export function runInsertion(
  count: number,
  picks: readonly Pick[],
): InsertionState {
  const ranking = count > 0 ? [0] : [];
  let done = 0;

  for (let item = 1; item < count; item++) {
    let low = 0;
    let high = ranking.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (done === picks.length) {
        return {
          ranking,
          current: { item, against: ranking[middle] },
          pending: range(item + 1, count),
          done,
          total: Math.max(estimateInsertion(count), done + 1),
        };
      }
      if (picks[done] === 0) {
        high = middle;
      } else {
        low = middle + 1;
      }
      done++;
    }
    ranking.splice(low, 0, item);
  }

  return { ranking, current: null, pending: [], done, total: done };
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start }, (_, i) => start + i);
}
