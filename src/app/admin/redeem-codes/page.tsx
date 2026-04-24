/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { DataTable } from '@/components/DataTable';
import { CopyButton } from '@/components/CopyButton';
import { MoneyText } from '@/components/MoneyText';

const initFilters = { status: '', code: '', batchNo: '', amount: '', usedByUserId: '', usedByEmail: '', createdAtFrom: '', createdAtTo: '', expiredAtFrom: '', expiredAtTo: '' };

export default function AdminRedeemCodesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, unused: 0, used: 0, disabled: 0, expired: 0, totalAmount: '0', usedAmount: '0', unusedAmount: '0' });
  const [filters, setFilters] = useState<any>(initFilters);
  const [single, setSingle] = useState<any>({ code: '', amount: '100', batchNo: '', expiredAt: '', remark: '' });
  const [batch, setBatch] = useState<any>({ count: 10, amount: '100', batchNo: '', expiredAt: '', remark: '', codePrefix: 'GD' });
  const [batchCreatedCodes, setBatchCreatedCodes] = useState('');

  const queryString = new URLSearchParams(Object.entries(filters).filter(([, value]) => String(value).trim() !== '') as [string, string][]).toString();

  const load = async () => {
    const d = await fetch(`/api/admin/redeem-codes${queryString ? `?${queryString}` : ''}`).then((r) => r.json());
    setRows(d.data?.items ?? []);
    setStats(d.data?.stats ?? stats);
  };
  useEffect(() => { void load(); }, [queryString]);

  return (
    <AdminShell>
      <h1 className="mb-4 text-2xl font-semibold">兑换码管理</h1>
      <div className="mb-4 grid grid-cols-5 gap-2 rounded-xl border p-3">
        <input className="rounded border px-2 py-1" placeholder="code" value={filters.code} onChange={(e) => setFilters({ ...filters, code: e.target.value })} />
        <select className="rounded border px-2 py-1" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">全部</option><option value="unused">unused</option><option value="used">used</option><option value="disabled">disabled</option><option value="expired">expired</option></select>
        <input className="rounded border px-2 py-1" placeholder="batchNo" value={filters.batchNo} onChange={(e) => setFilters({ ...filters, batchNo: e.target.value })} />
        <input className="rounded border px-2 py-1" placeholder="amount" value={filters.amount} onChange={(e) => setFilters({ ...filters, amount: e.target.value })} />
        <input className="rounded border px-2 py-1" placeholder="usedByUserId" value={filters.usedByUserId} onChange={(e) => setFilters({ ...filters, usedByUserId: e.target.value })} />
        <input className="rounded border px-2 py-1" placeholder="usedByEmail" value={filters.usedByEmail} onChange={(e) => setFilters({ ...filters, usedByEmail: e.target.value })} />
        <input className="rounded border px-2 py-1" type="date" value={filters.createdAtFrom} onChange={(e) => setFilters({ ...filters, createdAtFrom: e.target.value })} />
        <input className="rounded border px-2 py-1" type="date" value={filters.createdAtTo} onChange={(e) => setFilters({ ...filters, createdAtTo: e.target.value })} />
        <input className="rounded border px-2 py-1" type="date" value={filters.expiredAtFrom} onChange={(e) => setFilters({ ...filters, expiredAtFrom: e.target.value })} />
        <input className="rounded border px-2 py-1" type="date" value={filters.expiredAtTo} onChange={(e) => setFilters({ ...filters, expiredAtTo: e.target.value })} />
      </div>

      <p className="mb-3 text-sm text-stone-600">总数 {stats.total} / 未使用 {stats.unused} / 已使用 {stats.used} / 禁用 {stats.disabled} / 过期 {stats.expired} / 总金额 <MoneyText value={stats.totalAmount} /> / 已兑换 <MoneyText value={stats.usedAmount} /> / 未兑换 <MoneyText value={stats.unusedAmount} /></p>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <form className="rounded-xl border p-3" onSubmit={async (e) => { e.preventDefault(); await fetch('/api/admin/redeem-codes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(single) }); setSingle({ code: '', amount: '100', batchNo: '', expiredAt: '', remark: '' }); void load(); }}>
          <h2 className="mb-2 font-semibold">单个创建</h2>
          <input className="mb-2 w-full rounded border px-2 py-1" placeholder="code(可选)" value={single.code} onChange={(e) => setSingle({ ...single, code: e.target.value })} />
          <input className="mb-2 w-full rounded border px-2 py-1" placeholder="amount" value={single.amount} onChange={(e) => setSingle({ ...single, amount: e.target.value })} required />
          <input className="mb-2 w-full rounded border px-2 py-1" placeholder="batchNo" value={single.batchNo} onChange={(e) => setSingle({ ...single, batchNo: e.target.value })} />
          <input className="mb-2 w-full rounded border px-2 py-1" type="datetime-local" value={single.expiredAt} onChange={(e) => setSingle({ ...single, expiredAt: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
          <input className="mb-2 w-full rounded border px-2 py-1" placeholder="remark" value={single.remark} onChange={(e) => setSingle({ ...single, remark: e.target.value })} />
          <button className="rounded bg-stone-900 px-3 py-2 text-sm text-white">创建</button>
        </form>
        <form className="rounded-xl border p-3" onSubmit={async (e) => { e.preventDefault(); const res = await fetch('/api/admin/redeem-codes/batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(batch) }); const d = await res.json(); setBatchCreatedCodes((d.data ?? []).map((i: any) => i.code).join('\n')); void load(); }}>
          <h2 className="mb-2 font-semibold">批量生成</h2>
          <input className="mb-2 w-full rounded border px-2 py-1" type="number" min="1" placeholder="count" value={batch.count} onChange={(e) => setBatch({ ...batch, count: Number(e.target.value) })} required />
          <input className="mb-2 w-full rounded border px-2 py-1" placeholder="amount" value={batch.amount} onChange={(e) => setBatch({ ...batch, amount: e.target.value })} required />
          <input className="mb-2 w-full rounded border px-2 py-1" placeholder="batchNo" value={batch.batchNo} onChange={(e) => setBatch({ ...batch, batchNo: e.target.value })} />
          <input className="mb-2 w-full rounded border px-2 py-1" placeholder="codePrefix" value={batch.codePrefix} onChange={(e) => setBatch({ ...batch, codePrefix: e.target.value })} />
          <button className="rounded bg-stone-900 px-3 py-2 text-sm text-white">批量生成</button>
          {batchCreatedCodes ? <button type="button" className="ml-2 rounded border px-3 py-2 text-sm" onClick={() => navigator.clipboard.writeText(batchCreatedCodes)}>复制本批次</button> : null}
        </form>
      </div>

      <div className="mb-3 flex gap-2">
        <a className="rounded border px-3 py-1" href={`/api/admin/redeem-codes/export${queryString ? `?${queryString}` : ''}`} target="_blank">导出当前筛选</a>
        <a className="rounded border px-3 py-1" href="/api/admin/redeem-codes/export?status=unused" target="_blank">导出 unused</a>
        <a className="rounded border px-3 py-1" href="/api/admin/redeem-codes/export" target="_blank">导出全部</a>
      </div>

      <DataTable headers={['code', 'amount', 'status', 'batchNo', 'remark', 'expiredAt', 'usedByUser', 'usedAt', 'createdAt', '操作']} rows={rows.map((r) => [<div key={r.id} className="flex items-center gap-2"><span>{r.code}</span><CopyButton text={r.code} /></div>, <MoneyText key={`${r.id}m`} value={r.amount} />, r.status, r.batchNo ?? '-', r.remark ?? '-', r.expiredAt ? new Date(r.expiredAt).toLocaleString() : '-', r.usedByUser?.email ?? r.usedByUserId ?? '-', r.usedAt ? new Date(r.usedAt).toLocaleString() : '-', new Date(r.createdAt).toLocaleString(), <div key={`${r.id}op`} className="flex gap-2"><button className="rounded border px-2 py-1 text-xs" onClick={async () => { await navigator.clipboard.writeText(r.code); }}>复制</button><button className="rounded border px-2 py-1 text-xs" disabled={r.status !== 'unused'} onClick={async () => { await fetch(`/api/admin/redeem-codes/${r.id}/disable`, { method: 'PATCH' }); void load(); }}>禁用</button></div>])} />
    </AdminShell>
  );
}
