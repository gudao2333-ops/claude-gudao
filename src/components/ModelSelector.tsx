'use client';

type Model = { modelKey: string; name: string; description?: string | null };

export function ModelSelector({ models, value, onChange }: { models: Model[]; value: string; onChange: (v: string) => void }) {
  return (
    <select className="rounded-lg border border-stone-300 px-3 py-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
      {models.map((m) => (
        <option key={m.modelKey} value={m.modelKey}>
          {m.name}
        </option>
      ))}
    </select>
  );
}
