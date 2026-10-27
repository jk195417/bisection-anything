import { parseSession, Session } from './session';

/** Compresses a session into a URL-safe string for share links. */
export async function encodeSession(session: Session): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(session));
  const compressed = await pipe(json, new CompressionStream('deflate-raw'));
  let binary = '';
  for (const byte of compressed) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

export async function decodeSession(code: string): Promise<Session> {
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    const binary = atob(code.replaceAll('-', '+').replaceAll('_', '/'));
    bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    throw new Error('分享連結格式不正確');
  }
  let data: unknown;
  try {
    const raw = await pipe(bytes, new DecompressionStream('deflate-raw'));
    data = JSON.parse(new TextDecoder().decode(raw));
  } catch {
    throw new Error('分享連結內容已損毀');
  }
  return parseSession(data);
}

async function pipe(
  bytes: Uint8Array<ArrayBuffer>,
  transform: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  }).pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
