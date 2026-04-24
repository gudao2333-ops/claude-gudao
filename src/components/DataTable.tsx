import { ReactNode } from 'react';

export function DataTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-stone-50 text-left">
          <tr>{headers.map((h) => <th key={h} className="px-3 py-2 font-medium text-stone-600">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-stone-100">{r.map((c, ci) => <td key={ci} className="px-3 py-2">{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
