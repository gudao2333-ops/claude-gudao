/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { DataTable } from '@/components/DataTable';
import { CopyButton } from '@/components/CopyButton';
import { MoneyText } from '@/components/MoneyText';

export default function AdminRedeemCodesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const load = async () => {
    const d = await fetch(`/api/admin/redeem-codes?status=${status}`).then((r) => r.json());
    setRows(d.data?.items ?? []);
  };
  useEffect(() => { void load(); }, [status]);

  const stats = useMemo(() => {
    const total = rows.length;
    const unused = rows.filter((r) => r.status === 'unused').length;
    const used = rows.filter((r) => r.status === 'used').length;
    const disabled = rows.filter((r) => r.status === 'disabled').length;
    const expired = rows.filter((r) => r.status === 'expired').length;
    const totalAmount = rows.reduce((a, b) => a + Number(b.amount ?? 0), 0);
    const usedAmount = rows.filter((r) => r.status === 'used').reduce((a, b) => a + Number(b.amount ?? 0), 0);
    return { total, unused, used, disabled, expired, totalAmount, usedAmount };
  }, [rows]);

  return (
    <AdminShell>
      <div className="mb-4 flex flex-wrap gap-2">
        <h1 className="mr-auto text-2xl font-semibold">兑换码管理</h1>
        <select className="rounded border px-2" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">全部</option><option value="unused">unused</option><option value="used">used</option><option value="disabled">disabled</option><option value="expired">expired</option></select>
        <button className="rounded border px-3 py-1" onClick={async () => { const amount = prompt('金额'); if (!amount) return; await fetch('/api/admin/redeem-codes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount }) }); void load(); }}>创建单个</button>
        <button className="rounded border px-3 py-1" onClick={async () => { const count = prompt('数量'); const amount = prompt('金额'); if (!count || !amount) return; await fetch('/api/admin/redeem-codes/batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ count: Number(count), amount }) }); void load(); }}>批量生成</button>
        <button className="rounded border px-3 py-1" onClick={async () => { const text = rows.filter((r) => r.status === 'unused').map((r) => r.code).join('\n'); await navigator.clipboard.writeText(text); alert('已复制未使用兑换码'); }}>批量复制未使用</button>
      </div>
      <p className="mb-3 text-sm text-stone-600">总数 {stats.total} / 未使用 {stats.unused} / 已使用 {stats.used} / 禁用 {stats.disabled} / 过期 {stats.expired} / 总金额 ¥{stats.totalAmount.toFixed(2)} / 已兑换 ¥{stats.usedAmount.toFixed(2)}</p>
      <DataTable
        headers={['code', 'amount', 'status', 'batch', 'usedBy', 'usedAt', '操作']}
        rows={rows.map((r) => [
          <div key={r.id} className="flex items-center gap-2"><span>{r.code}</span><CopyButton text={r.code} /></div>,
          <MoneyText key={`${r.id}m`} value={r.amount} />,
          r.status,
          r.batchNo ?? '-',
          r.usedByUserId ?? '-',
          r.usedAt ? new Date(r.usedAt).toLocaleString() : '-',
          <div key={`${r.id}op`} className="flex gap-2"><button className="rounded border px-2 py-1 text-xs" onClick={async () => { await fetch(`/api/admin/redeem-codes/${r.id}/disable`, { method: 'PATCH' }); void load(); }}>禁用</button><a className="rounded border px-2 py-1 text-xs" href="/api/admin/redeem-codes/export" target="_blank">导出</a></div>,
        ])}
      />
    </AdminShell>
  );
}
