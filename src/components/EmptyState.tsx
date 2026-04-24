export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
      <h3 className="text-lg font-semibold text-stone-700">{title}</h3>
      {description ? <p className="mt-2 text-sm text-stone-500">{description}</p> : null}
    </div>
  );
}
