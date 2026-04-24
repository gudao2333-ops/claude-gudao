'use client';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ open, title, description, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description ? <p className="mt-2 text-sm text-stone-600">{description}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <button className="rounded-lg border px-3 py-2" onClick={onCancel}>取消</button>
          <button className="rounded-lg bg-rose-600 px-3 py-2 text-white" onClick={onConfirm}>确认</button>
        </div>
      </div>
    </div>
  );
}
