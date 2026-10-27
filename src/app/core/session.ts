/** Single elimination picks a champion; insertion builds a full ranking. */
export type Mode = 'elimination' | 'insertion';

/** Answer to one comparison: 0 = the left option, 1 = the right option. */
export type Pick = 0 | 1;

/**
 * Everything needed to restore a session. All derived state (brackets,
 * rankings, the current comparison) is recomputed by replaying `picks`.
 */
export interface Session {
  version: 1;
  title: string;
  mode: Mode;
  /** Items in seed order: index 0 is the top seed. */
  items: string[];
  picks: Pick[];
}

export function createSession(
  title: string,
  mode: Mode,
  items: readonly string[],
): Session {
  return { version: 1, title, mode, items: [...items], picks: [] };
}

/** Validates untrusted data (an imported file or a shared link). */
export function parseSession(value: unknown): Session {
  if (typeof value !== 'object' || value === null) {
    throw new Error('資料格式不正確');
  }
  const { version, title, mode, items, picks } = value as Record<
    string,
    unknown
  >;
  if (version !== 1) {
    throw new Error(`不支援的資料版本：${String(version)}`);
  }
  if (typeof title !== 'string') {
    throw new Error('缺少標題');
  }
  if (mode !== 'elimination' && mode !== 'insertion') {
    throw new Error(`不支援的模式：${String(mode)}`);
  }
  if (!Array.isArray(items) || !items.every((it) => typeof it === 'string')) {
    throw new Error('項目清單格式不正確');
  }
  if (!Array.isArray(picks) || !picks.every((it) => it === 0 || it === 1)) {
    throw new Error('比較紀錄格式不正確');
  }
  return { version, title, mode, items, picks };
}

/** Splits text into one item per line, dropping blanks and duplicates. */
export function parseItems(text: string): {
  items: string[];
  duplicates: string[];
} {
  const items: string[] = [];
  const duplicates: string[] = [];
  for (const line of text.split('\n')) {
    const item = line.trim();
    if (!item) continue;
    if (items.includes(item)) {
      duplicates.push(item);
    } else {
      items.push(item);
    }
  }
  return { items, duplicates };
}

export function shuffle<T>(values: readonly T[], random = Math.random): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
