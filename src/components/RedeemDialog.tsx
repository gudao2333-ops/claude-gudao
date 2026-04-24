'use client';

import { useState } from 'react';

export function RedeemDialog({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h3 className="text-lg font-semibold">兑换码充值</h3>
        <input className="mt-4 w-full rounded-lg border px-3 py-2" value={code} onChange={(e) => setCode(e.target.value)} placeholder="输入兑换码" />
        {msg ? <p className="mt-2 text-sm text-stone-600">{msg}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button className="rounded-lg border px-3 py-2" onClick={onClose}>取消</button>
          <button
            className="rounded-lg bg-stone-900 px-3 py-2 text-white"
            onClick={async () => {
              const res = await fetch('/api/redeem-code/redeem', { method: 'POST', body: JSON.stringify({ code }), headers: { 'Content-Type': 'application/json' } });
              const data = await res.json();
              if (data.success) {
                setMsg(`成功充值 ¥${Number(data.data.amount).toFixed(2)}`);
                onSuccess();
              } else {
                setMsg(data.error?.message ?? '兑换失败');
              }
            }}
          >
            兑换
          </button>
        </div>
      </div>
    </div>
  );
}
