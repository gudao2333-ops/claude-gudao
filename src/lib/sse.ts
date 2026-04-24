export type ParsedSseEvent =
  | { type: 'delta'; content: string }
  | { type: 'billing'; payload: Record<string, unknown> }
  | { type: 'done' }
  | { type: 'unknown'; payload: Record<string, unknown> };

export function parseSseChunkBuffer(buffer: string) {
  const lines = buffer.split(/\r?\n/);
  const rest = lines.pop() ?? '';
  const events = lines
    .map((line) => line.trim())
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .filter(Boolean);
  return { events, rest };
}

export function parseSseEvent(data: string): ParsedSseEvent | null {
  if (!data || data === '[DONE]') return { type: 'done' };

  try {
    const parsed = JSON.parse(data) as Record<string, unknown>;
    if (parsed.type === 'delta') {
      const content = typeof parsed.content === 'string' ? parsed.content : '';
      return content ? { type: 'delta', content } : null;
    }

    if (parsed.type === 'billing' && typeof parsed === 'object') {
      return { type: 'billing', payload: parsed };
    }

    const choices = parsed.choices as Array<{ delta?: { content?: string } }> | undefined;
    const content = choices?.[0]?.delta?.content;
    if (typeof content === 'string' && content.length > 0) {
      return { type: 'delta', content };
    }

    if (parsed.usage) return { type: 'billing', payload: parsed };
    return { type: 'unknown', payload: parsed };
  } catch {
    return null;
  }
}
