import { Pick } from './session';

export interface Match {
  /** Item index, or null when the slot is a bye or not decided yet. */
  a: number | null;
  b: number | null;
  winner: number | null;
  /** First-round match where one side is empty and the other advances. */
  bye: boolean;
}

export interface MatchRef {
  round: number;
  match: number;
}

export interface EliminationState {
  rounds: Match[][];
  /** The next match waiting for a pick, or null when finished. */
  current: MatchRef | null;
  champion: number | null;
  done: number;
  total: number;
}

/**
 * Bracket slot order for `size` (a power of two) seeds, so that the top
 * seeds meet as late as possible: 8 -> [0, 7, 3, 4, 1, 6, 2, 5].
 */
export function seedOrder(size: number): number[] {
  let order = [0];
  while (order.length < size) {
    const length = order.length * 2;
    order = order.flatMap((seed) => [seed, length - 1 - seed]);
  }
  return order;
}

/**
 * Replays `picks` over a single elimination bracket of `count` items.
 * The bracket is padded to the next power of two; the missing seeds are
 * first-round byes, so the top seeds advance without a comparison.
 * Matches are played round by round, top to bottom.
 */
export function runElimination(
  count: number,
  picks: readonly Pick[],
): EliminationState {
  const size = count <= 1 ? count : 2 ** Math.ceil(Math.log2(count));
  let slots: (number | null)[] = seedOrder(size).map((seed) =>
    seed < count ? seed : null,
  );
  const rounds: Match[][] = [];
  let current: MatchRef | null = null;
  let done = 0;

  while (slots.length > 1) {
    const matches: Match[] = [];
    for (let i = 0; i < slots.length; i += 2) {
      const a = slots[i];
      const b = slots[i + 1];
      const bye = rounds.length === 0 && (a === null || b === null);
      let winner: number | null = null;
      if (bye) {
        winner = a ?? b;
      } else if (a !== null && b !== null) {
        if (done < picks.length) {
          winner = picks[done] === 0 ? a : b;
          done++;
        } else if (current === null) {
          current = { round: rounds.length, match: matches.length };
        }
      }
      matches.push({ a, b, winner, bye });
    }
    rounds.push(matches);
    slots = matches.map((it) => it.winner);
  }

  return {
    rounds,
    current,
    champion: slots[0] ?? null,
    done,
    total: Math.max(count - 1, 0),
  };
}

/** Name of a round counted from the final, e.g. 決賽, 四強, 八強. */
export function roundLabel(round: number, roundCount: number): string {
  switch (roundCount - round) {
    case 1:
      return '決賽';
    case 2:
      return '四強';
    case 3:
      return '八強';
    default:
      return `第 ${round + 1} 輪`;
  }
}
