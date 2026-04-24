import { NextResponse } from 'next/server';

export function ok<T>(data: T, message = 'ok', status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function fail(message: string, code = 'BAD_REQUEST', status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status },
  );
}

export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message
      .replace(/sk-[A-Za-z0-9-_]+/g, '***')
      .replace(/\/[^\s]+/g, '[path-hidden]');
    return msg;
  }
  return 'Unknown error';
}
