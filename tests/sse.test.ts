import { describe, expect, it } from 'vitest';
import { parseSseChunkBuffer, parseSseEvent } from '@/lib/sse';

describe('sse parser', () => {
  it('only collects delta content from raw openai chunks', () => {
    const source = [
      'data: {"id":"1","choices":[{"delta":{"content":"你"}}]}\n',
      'data: {"id":"1","choices":[{"delta":{"content":"好"}}]}\n',
      'data: {"id":"1","usage":{"total_tokens":12}}\n',
      'data: [DONE]\n\n',
    ].join('');

    const { events } = parseSseChunkBuffer(source);
    const text = events.map((e) => parseSseEvent(e)).filter((e) => e?.type === 'delta').map((e) => (e as { content: string }).content).join('');

    expect(text).toBe('你好');
    expect(events.some((e) => parseSseEvent(e)?.type === 'billing')).toBe(true);
  });
});
