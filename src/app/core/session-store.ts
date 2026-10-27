import { computed, effect, Injectable, signal } from '@angular/core';
import { roundLabel, runElimination } from './elimination';
import { runInsertion } from './insertion';
import {
  createSession,
  Mode,
  parseSession,
  Pick,
  Session,
  shuffle,
} from './session';
import { encodeSession } from './share-codec';

export const STORAGE_KEY = 'bisection-anything.session';

export interface Comparison {
  left: string;
  right: string;
  label: string;
}

/** The active session, persisted to localStorage on every change. */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  readonly session = signal<Session | null>(readStorage());

  readonly elimination = computed(() => {
    const session = this.session();
    return session?.mode === 'elimination'
      ? runElimination(session.items.length, session.picks)
      : null;
  });

  readonly insertion = computed(() => {
    const session = this.session();
    return session?.mode === 'insertion'
      ? runInsertion(session.items.length, session.picks)
      : null;
  });

  /** The comparison waiting for a pick, or null when there is none. */
  readonly comparison = computed<Comparison | null>(() => {
    const items = this.session()?.items ?? [];
    const elimination = this.elimination();
    const insertion = this.insertion();
    if (elimination?.current) {
      const { round, match } = elimination.current;
      const { a, b } = elimination.rounds[round][match];
      return {
        left: items[a!],
        right: items[b!],
        label: roundLabel(round, elimination.rounds.length),
      };
    }
    if (insertion?.current) {
      const { item, against } = insertion.current;
      return {
        left: items[item],
        right: items[against],
        label: `排入第 ${insertion.ranking.length + 1} / ${items.length} 項`,
      };
    }
    return null;
  });

  readonly progress = computed(() => {
    const state = this.elimination() ?? this.insertion();
    return { done: state?.done ?? 0, total: state?.total ?? 0 };
  });

  readonly finished = computed(
    () => this.session() !== null && this.comparison() === null,
  );

  constructor() {
    effect(() => writeStorage(this.session()));
  }

  start(title: string, mode: Mode, items: readonly string[], shuffled: boolean) {
    this.session.set(
      createSession(title, mode, shuffled ? shuffle(items) : items),
    );
  }

  pick(pick: Pick) {
    if (!this.comparison()) return;
    this.session.update(
      (it) => it && { ...it, picks: [...it.picks, pick] },
    );
  }

  undo() {
    this.session.update(
      (it) => it && { ...it, picks: it.picks.slice(0, -1) },
    );
  }

  clear() {
    this.session.set(null);
  }

  load(session: Session) {
    this.session.set(session);
  }

  /** Throws with a readable message when the text is not a session. */
  importJson(text: string) {
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('不是有效的 JSON 檔案');
    }
    this.load(parseSession(data));
  }

  exportJson(): string {
    return JSON.stringify(this.session(), null, 2);
  }

  /** A link that restores the current session, including all picks. */
  async shareLink(): Promise<string> {
    const session = this.session();
    if (!session) throw new Error('目前沒有可以分享的比較');
    const code = await encodeSession(session);
    return new URL(`share#${code}`, document.baseURI).href;
  }
}

function readStorage(): Session | null {
  try {
    const text = localStorage.getItem(STORAGE_KEY);
    return text ? parseSession(JSON.parse(text)) : null;
  } catch {
    return null;
  }
}

function writeStorage(session: Session | null) {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage can be full or disabled; the session still works in memory.
  }
}
