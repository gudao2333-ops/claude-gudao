import { env } from '@/lib/env';
import { getSetting } from './settings.service';

export type NewApiErrorCode =
  | 'MODEL_UNAVAILABLE'
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_AUTH_ERROR'
  | 'UPSTREAM_RATE_LIMIT'
  | 'UPSTREAM_ERROR';

export class NewApiError extends Error {
  constructor(
    public code: NewApiErrorCode,
    message: string,
    public status = 500,
  ) {
    super(message);
  }
}

async function getConfig() {
  const baseUrl = (await getSetting('newapi_base_url')) ?? env.NEWAPI_BASE_URL;
  const apiKey = (await getSetting('newapi_api_key')) ?? env.NEWAPI_API_KEY;
  const group = (await getSetting('newapi_default_group')) ?? env.NEWAPI_DEFAULT_GROUP;
  return { baseUrl, apiKey, group };
}

function sanitizeUpstreamError(status: number, text: string): NewApiError {
  if (status === 401 || status === 403) return new NewApiError('UPSTREAM_AUTH_ERROR', 'Upstream auth failed', status);
  if (status === 404) return new NewApiError('MODEL_UNAVAILABLE', 'Model unavailable', status);
  if (status === 429) return new NewApiError('UPSTREAM_RATE_LIMIT', 'Upstream rate limit', status);
  if (status >= 500) return new NewApiError('UPSTREAM_ERROR', 'Upstream internal error', status);
  return new NewApiError('UPSTREAM_ERROR', text.slice(0, 120), status);
}

export async function chatCompletion(payload: Record<string, unknown>) {
  const { baseUrl, apiKey, group } = await getConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...payload, stream: false, group }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw sanitizeUpstreamError(res.status, JSON.stringify(data));
    }

    return {
      content: data?.choices?.[0]?.message?.content ?? '',
      usage: data?.usage,
      responseId: data?.id,
      raw: data,
    };
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new NewApiError('UPSTREAM_TIMEOUT', 'Upstream timeout', 504);
    }
    if (error instanceof NewApiError) throw error;
    throw new NewApiError('UPSTREAM_ERROR', 'Unknown upstream error', 500);
  } finally {
    clearTimeout(timeout);
  }
}

export async function streamChatCompletion(payload: Record<string, unknown>) {
  const { baseUrl, apiKey, group } = await getConfig();
  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...payload, stream: true, group }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => 'stream error');
    throw sanitizeUpstreamError(res.status, text);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let content = '';
  let usage: unknown = null;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        controller.enqueue(value);

        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const payloadText = line.slice(6).trim();
          if (!payloadText || payloadText === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payloadText);
            content += parsed?.choices?.[0]?.delta?.content ?? '';
            usage = parsed?.usage ?? usage;
          } catch {
            // ignore malformed chunk
          }
        }
      }
      controller.close();
    },
  });

  return {
    stream,
    getFinal: () => ({ content, usage }),
  };
}

export async function fetchPricing() {
  const { baseUrl, apiKey } = await getConfig();
  const res = await fetch(`${baseUrl}/api/pricing`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw sanitizeUpstreamError(res.status, 'pricing failed');
  return res.json();
}

export async function testConnection() {
  const data = await chatCompletion({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 });
  return { ok: true, responseId: data.responseId };
}
