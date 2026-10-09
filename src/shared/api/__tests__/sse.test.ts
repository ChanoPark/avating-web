import { describe, it, expect } from 'vitest';
import { http as mswHttp, HttpResponse } from 'msw';
import { server } from '@shared/mocks/server';
import { readSseFrames, type SseFrame } from '../sse';

const encoder = new TextEncoder();

function streamOf(chunks: (string | Uint8Array)[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(typeof chunk === 'string' ? encoder.encode(chunk) : chunk);
      }
      controller.close();
    },
  });
}

async function collect(chunks: (string | Uint8Array)[]): Promise<SseFrame[]> {
  const frames: SseFrame[] = [];
  for await (const frame of readSseFrames(streamOf(chunks))) frames.push(frame);
  return frames;
}

describe('readSseFrames', () => {
  it('event 와 data 를 가진 프레임을 하나씩 낸다', async () => {
    expect(
      await collect(['event:turn_started\ndata:{"a":1}\n\nevent:delta\ndata:{"b":2}\n\n'])
    ).toEqual([
      { event: 'turn_started', data: '{"a":1}' },
      { event: 'delta', data: '{"b":2}' },
    ]);
  });

  it('프레임이 chunk 경계에서 잘려도 이어 붙인다', async () => {
    expect(await collect(['event:del', 'ta\ndata:{"te', 'xt":"조각"}\n', '\n'])).toEqual([
      { event: 'delta', data: '{"text":"조각"}' },
    ]);
  });

  it('한글이 chunk 경계에서 바이트 단위로 잘려도 깨지지 않는다', async () => {
    const bytes = encoder.encode('data:안녕\n\n');
    expect(await collect([bytes.slice(0, 7), bytes.slice(7)])).toEqual([
      { event: 'message', data: '안녕' },
    ]);
  });

  it('CRLF 줄바꿈과 data: 뒤 공백 한 칸을 받아들인다', async () => {
    expect(await collect(['event: delta\r\ndata: {"a":1}\r\n\r\n'])).toEqual([
      { event: 'delta', data: '{"a":1}' },
    ]);
  });

  it('CRLF 가 chunk 경계에서 갈려도 빈 줄로 오인하지 않는다', async () => {
    expect(await collect(['data:x\r', '\ndata:y\r\n\r', '\n'])).toEqual([
      { event: 'message', data: 'x\ny' },
    ]);
  });

  it('data 가 여러 줄이면 줄바꿈으로 잇는다', async () => {
    expect(await collect(['data:첫 줄\ndata:둘째 줄\n\n'])).toEqual([
      { event: 'message', data: '첫 줄\n둘째 줄' },
    ]);
  });

  it('주석(heartbeat) 줄과 data 없는 프레임은 버린다', async () => {
    expect(await collect([':keepalive\n\n', 'event:ping\n\n', 'data:x\n\n'])).toEqual([
      { event: 'message', data: 'x' },
    ]);
  });

  it('빈 줄로 끝나지 않은 마지막 조각은 내지 않는다', async () => {
    expect(await collect(['data:done\n\ndata:half'])).toEqual([{ event: 'message', data: 'done' }]);
  });

  it('signal 이 abort 되면 열려 있는 스트림 읽기를 끝낸다', async () => {
    const controller = new AbortController();
    const open = new ReadableStream<Uint8Array>({
      start(stream) {
        stream.enqueue(encoder.encode('data:first\n\n'));
      },
    });

    const frames: SseFrame[] = [];
    for await (const frame of readSseFrames(open, controller.signal)) {
      frames.push(frame);
      controller.abort();
    }

    expect(frames).toEqual([{ event: 'message', data: 'first' }]);
  });

  it('MSW 가 흘려 주는 text/event-stream 응답을 fetch 로 읽는다', async () => {
    const url = `${import.meta.env.VITE_AI_API_BASE_URL as string}/v1/sessions/sim-1/stream`;
    server.use(
      mswHttp.get(
        url,
        () =>
          new HttpResponse(
            streamOf(['event:delta\ndata:{"seq":0}\n\n', 'event:delta\ndata:{"seq":1}\n\n']),
            {
              headers: { 'Content-Type': 'text/event-stream' },
            }
          )
      )
    );

    const response = await fetch(url);
    const frames: SseFrame[] = [];
    if (response.body === null) throw new Error('본문이 없다');
    for await (const frame of readSseFrames(response.body)) frames.push(frame);

    expect(frames).toEqual([
      { event: 'delta', data: '{"seq":0}' },
      { event: 'delta', data: '{"seq":1}' },
    ]);
  });
});
