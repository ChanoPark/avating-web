export type SseFrame = {
  event: string;
  data: string;
};

const DEFAULT_EVENT = 'message';

function parseFrame(block: string): SseFrame | null {
  let event = DEFAULT_EVENT;
  const data: string[] = [];

  for (const line of block.split('\n')) {
    if (line === '' || line.startsWith(':')) continue;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    const rest = colon === -1 ? '' : line.slice(colon + 1);
    const value = rest.startsWith(' ') ? rest.slice(1) : rest;
    if (field === 'event') event = value;
    if (field === 'data') data.push(value);
  }

  return data.length === 0 ? null : { event, data: data.join('\n') };
}

/** signal 이 abort 되면 읽기를 끝낸다 — fetch 의 signal 만으로는 이미 받은 본문의 read() 가 풀리지 않는 환경이 있다. */
export async function* readSseFrames(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal
): AsyncGenerator<SseFrame, void, undefined> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let heldCarriageReturn = '';

  const cancel = () => {
    void reader.cancel().catch(() => undefined);
  };
  signal?.addEventListener('abort', cancel);
  if (signal?.aborted === true) cancel();

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      const text = heldCarriageReturn + decoder.decode(value, { stream: true });
      heldCarriageReturn = text.endsWith('\r') ? '\r' : '';
      buffer += text.slice(0, text.length - heldCarriageReturn.length).replace(/\r\n?/g, '\n');

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const frame = parseFrame(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        if (frame !== null) yield frame;
        boundary = buffer.indexOf('\n\n');
      }
    }
  } finally {
    signal?.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}
