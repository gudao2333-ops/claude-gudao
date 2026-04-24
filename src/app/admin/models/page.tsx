/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { DataTable } from '@/components/DataTable';

const emptyForm = {
  name: '', modelKey: '', channelId: '', newapiModelName: '', provider: 'newapi', description: '', enabled: true, visible: true, sort: 0,
  billingMode: 'newapi_ratio', quotaType: 0, modelRatio: '1', completionRatio: '1', groupRatio: '1', modelPrice: '0', quotaToCnyRate: '0.000015',
  inputPricePer1kCny: '0', outputPricePer1kCny: '0', cacheReadPricePer1kCny: '0', cacheWritePricePer1kCny: '0', reasoningPricePer1kCny: '0', imageInputPricePer1kCny: '0', audioInputPricePer1kCny: '0', audioOutputPricePer1kCny: '0',
  fixedCostCny: '0', fixedPriceCny: '0', profitRate: '1.6', depositAmount: '0.2', minChargeAmount: '0.001', maxContextTokens: 32000, maxOutputTokens: 4096,
};

export default function AdminModelsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState('');

  const load = async () => {
    const d = await fetch('/api/admin/models').then((r) => r.json());
    setRows(d.data ?? []);
    const c = await fetch('/api/admin/channels').then((r) => r.json());
    setChannels(c.data ?? []);
    if (!form.channelId && c.data?.[0]?.id) setForm((prev: any) => ({ ...prev, channelId: c.data[0].id }));
  };
  useEffect(() => { void load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? 'PATCH' : 'POST';
    const url = editingId ? `/api/admin/models/${editingId}` : '/api/admin/models';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setEditingId('');
    setForm({ ...emptyForm, channelId: channels[0]?.id ?? '' });
    void load();
  };

  return (
    <AdminShell>
      <h1 className="mb-4 text-2xl font-semibold">模型管理</h1>
      <form className="mb-4 grid grid-cols-3 gap-2 rounded-xl border p-3" onSubmit={submit}>
        <input className="rounded border px-2 py-1" placeholder="展示名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="rounded border px-2 py-1" placeholder="modelKey" value={form.modelKey} onChange={(e) => setForm({ ...form, modelKey: e.target.value })} required />
        <input className="rounded border px-2 py-1" placeholder="newapiModelName" value={form.newapiModelName} onChange={(e) => setForm({ ...form, newapiModelName: e.target.value })} required />
        <select className="rounded border px-2 py-1" value={form.channelId} onChange={(e) => setForm({ ...form, channelId: e.target.value })} required>{channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className="rounded border px-2 py-1" value={form.billingMode} onChange={(e) => setForm({ ...form, billingMode: e.target.value })}><option value="newapi_ratio">newapi_ratio</option><option value="detailed_token">detailed_token</option><option value="fixed">fixed</option></select>
        <input className="rounded border px-2 py-1" placeholder="provider" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
        <input className="rounded border px-2 py-1" type="number" min="0" step="0.000001" placeholder="depositAmount" value={form.depositAmount} onChange={(e) => setForm({ ...form, depositAmount: e.target.value })} />
        <input className="rounded border px-2 py-1" type="number" min="0" step="0.000001" placeholder="minChargeAmount" value={form.minChargeAmount} onChange={(e) => setForm({ ...form, minChargeAmount: e.target.value })} />
        <input className="rounded border px-2 py-1" type="number" min="0" step="0.000001" placeholder="profitRate" value={form.profitRate} onChange={(e) => setForm({ ...form, profitRate: e.target.value })} />
        <input className="rounded border px-2 py-1" type="number" min="0" step="0.000001" placeholder="inputPricePer1kCny" value={form.inputPricePer1kCny} onChange={(e) => setForm({ ...form, inputPricePer1kCny: e.target.value })} />
        <input className="rounded border px-2 py-1" type="number" min="0" step="0.000001" placeholder="outputPricePer1kCny" value={form.outputPricePer1kCny} onChange={(e) => setForm({ ...form, outputPricePer1kCny: e.target.value })} />
        <input className="rounded border px-2 py-1" type="number" min="0" step="0.000001" placeholder="fixedPriceCny" value={form.fixedPriceCny} onChange={(e) => setForm({ ...form, fixedPriceCny: e.target.value })} />
        <button className="col-span-3 rounded bg-stone-900 px-3 py-2 text-sm text-white">{editingId ? '更新模型' : '新增模型'}</button>
      </form>
      <DataTable headers={['name', 'modelKey', 'channel', 'newapiModelName', 'provider', 'enabled', 'visible', 'billingMode', 'depositAmount', 'minChargeAmount', 'profitRate', 'sort', '操作']} rows={rows.map((m) => [m.name, m.modelKey, m.channel?.name ?? '-', m.newapiModelName, m.provider ?? '-', String(m.enabled), String(m.visible), m.billingMode, m.depositAmount, m.minChargeAmount, m.profitRate, String(m.sort), <div key={m.id} className="flex gap-2"><button className="rounded border px-2 py-1 text-xs" onClick={() => { setEditingId(m.id); setForm({ ...emptyForm, ...m }); }}>编辑</button><button className="rounded border px-2 py-1 text-xs" onClick={async () => { await fetch(`/api/admin/models/${m.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !m.enabled }) }); void load(); }}>{m.enabled ? '禁用' : '启用'}</button><button className="rounded border px-2 py-1 text-xs" onClick={async () => { await fetch(`/api/admin/models/${m.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ visible: !m.visible }) }); void load(); }}>{m.visible ? '隐藏' : '显示'}</button><button className="rounded border px-2 py-1 text-xs" onClick={() => navigator.clipboard.writeText(JSON.stringify(m, null, 2))}>复制配置</button><button className="rounded border px-2 py-1 text-xs text-red-600" onClick={async () => { if (!confirm('确认删除模型？')) return; await fetch(`/api/admin/models/${m.id}`, { method: 'DELETE' }); void load(); }}>删除</button></div>] )} />
    </AdminShell>
  );
}
