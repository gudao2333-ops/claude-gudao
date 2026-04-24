'use client';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  loading: boolean;
};

export function ChatInput({ value, onChange, onSend, onStop, loading }: Props) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-3">
      <textarea
        className="h-24 w-full resize-none rounded-lg border border-stone-200 p-3 text-sm outline-none"
        value={value}
        placeholder="输入你的问题..."
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="mt-3 flex justify-end gap-2">
        {loading ? (
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={onStop}>停止生成</button>
        ) : null}
        <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm text-white" onClick={onSend}>
          发送
        </button>
      </div>
    </div>
  );
}
