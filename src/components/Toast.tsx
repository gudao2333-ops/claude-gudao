'use client';

export function Toast({ message, type = 'info' }: { message: string; type?: 'info' | 'error' | 'success' }) {
  const color = type === 'error' ? 'bg-rose-600' : type === 'success' ? 'bg-emerald-600' : 'bg-stone-800';
  return <div className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm text-white shadow ${color}`}>{message}</div>;
}
