const map: Record<string, string> = {
  success: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-rose-100 text-rose-700',
  estimated: 'bg-violet-100 text-violet-700',
  refunded: 'bg-sky-100 text-sky-700',
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`rounded-full px-2 py-1 text-xs ${map[status] ?? 'bg-stone-100 text-stone-700'}`}>{status}</span>;
}
