/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { DataTable } from '@/components/DataTable';

const emptyForm = { name: '', baseUrl: '', apiKey: '', defaultGroup: 'default', enabled: true, priority: 0, timeoutMs: 60000, remark: '' };

export default function AdminChannelsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);

  const load = async () => {
    const d = await fetch('/api/admin/channels').then((r) => r.json());
    setRows(d.data ?? []);
  };

  useEffect(() => { void load(); }, []);

  return (
    <AdminShell>
      <h1 className="mb-4 text-2xl font-semibold">渠道管理</h1>
      <form className="mb-4 grid grid-cols-2 gap-2 rounded-xl border p-3" onSubmit={async (e) => {
        e.preventDefault();
        await fetch('/api/admin/channels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        setForm(emptyForm);
        void load();
      }}>
        <input className="rounded border px-2 py-1" placeholder="名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="rounded border px-2 py-1" placeholder="Base URL" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} required />
        <input className="rounded border px-2 py-1" placeholder="API Key" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} required />
        <input className="rounded border px-2 py-1" placeholder="默认组" value={form.defaultGroup} onChange={(e) => setForm({ ...form, defaultGroup: e.target.value })} />
        <input className="rounded border px-2 py-1" type="number" placeholder="优先级" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} />
        <input className="rounded border px-2 py-1" type="number" placeholder="超时(ms)" value={form.timeoutMs} onChange={(e) => setForm({ ...form, timeoutMs: Number(e.target.value) })} />
        <input className="col-span-2 rounded border px-2 py-1" placeholder="备注" value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} />
        <button className="col-span-2 rounded bg-stone-900 px-3 py-2 text-sm text-white">新增渠道</button>
      </form>
      <DataTable
        headers={['name', 'baseUrl', 'defaultGroup', 'apiKey', 'enabled', 'priority', 'timeoutMs', 'remark', '操作']}
        rows={rows.map((row) => [
          row.name,
          row.baseUrl,
          row.defaultGroup ?? '-',
          row.apiKey,
          String(row.enabled),
          String(row.priority),
          String(row.timeoutMs),
          row.remark ?? '-',
          <div key={row.id} className="flex gap-2">
            <button className="rounded border px-2 py-1 text-xs" onClick={async () => { await fetch(`/api/admin/channels/${row.id}/test`, { method: 'POST' }); alert('测试请求已发送'); }}>测试</button>
            <button className="rounded border px-2 py-1 text-xs" onClick={async () => { await fetch(`/api/admin/channels/${row.id}/sync-pricing`, { method: 'POST' }); alert('已触发价格同步'); }}>同步价格</button>
            <button className="rounded border px-2 py-1 text-xs" onClick={async () => { await fetch(`/api/admin/channels/${row.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !row.enabled }) }); void load(); }}>{row.enabled ? '禁用' : '启用'}</button>
            <button className="rounded border px-2 py-1 text-xs text-red-600" onClick={async () => { if (!confirm('确认删除渠道？')) return; await fetch(`/api/admin/channels/${row.id}`, { method: 'DELETE' }); void load(); }}>删除</button>
          </div>,
        ])}
      />
    </AdminShell>
  );
}
