/**
 * An item line may carry an image: `名稱 | https://example.com/a.png`, or
 * just the image URL. Sessions still store the raw line, so old sessions,
 * JSON files and share links keep working unchanged.
 */
export interface Item {
  name: string;
  image: string | null;
}

const WITH_NAME = /^(.*?)\s*\|\s*(https?:\/\/\S+)$/;
const URL_ONLY = /^https?:\/\/\S+$/;

export function parseItem(text: string): Item {
  const line = text.trim();
  const named = WITH_NAME.exec(line);
  if (named) {
    return { name: named[1] || fileName(named[2]), image: named[2] };
  }
  if (URL_ONLY.test(line)) {
    return { name: fileName(line), image: line };
  }
  return { name: line, image: null };
}

/** The display name of an item line, without its image URL. */
export function itemName(text: string): string {
  return parseItem(text).name;
}

function fileName(url: string): string {
  try {
    const last = new URL(url).pathname.split('/').filter(Boolean).pop();
    if (last) return decodeURIComponent(last).replace(/\.[a-z0-9]+$/i, '');
  } catch {
    // Fall through to the raw URL.
  }
  return url;
}
