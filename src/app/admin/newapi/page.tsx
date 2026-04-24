'use client';

import { useState } from 'react';
import { AdminShell } from '@/components/AdminShell';

export default function AdminNewApiPage() {
  const [msg, setMsg] = useState('');

  return (
    <AdminShell>
      <h1 className="mb-4 text-2xl font-semibold">NewAPI 对接</h1>
      <div className="space-y-2 rounded-2xl border border-stone-200 bg-white p-4">
        <button className="rounded border px-3 py-2" onClick={async () => {
          const res = await fetch('/api/admin/newapi/test', { method: 'POST' });
          const d = await res.json();
          setMsg(d.success ? '连接成功' : d.error?.message ?? '连接失败');
        }}>测试连接</button>
        <button className="rounded border px-3 py-2" onClick={async () => {
          const res = await fetch('/api/admin/models/sync-newapi-pricing', { method: 'POST' });
          const d = await res.json();
          setMsg(d.success ? `同步完成：${d.data?.synced ?? 0}` : d.error?.message ?? '同步失败');
        }}>同步价格</button>
        {msg ? <p className="text-sm text-stone-600">{msg}</p> : null}
      </div>
    </AdminShell>
  );
}
