/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { DataTable } from '@/components/DataTable';
import { MoneyText } from '@/components/MoneyText';

export default function AdminUsersPage() {
  const [rows, setRows] = useState<any[]>([]);

  const load = async () => {
    const d = await fetch('/api/admin/users').then((r) => r.json());
    setRows(d.data?.items ?? []);
  };

  useEffect(() => { void load(); }, []);

  return (
    <AdminShell>
      <h1 className="mb-4 text-2xl font-semibold">用户管理</h1>
      <DataTable
        headers={['邮箱', '余额', '冻结', '状态', '操作']}
        rows={rows.map((u) => [
          u.email ?? '-',
          <MoneyText key={`${u.id}b`} value={u.balance} />,
          <MoneyText key={`${u.id}f`} value={u.frozenBalance} />,
          u.status,
          <div key={u.id} className="flex gap-2">
            <button className="rounded border px-2 py-1 text-xs" onClick={async () => { const amt = prompt('输入调整金额（可负数）'); if (!amt) return; await fetch(`/api/admin/users/${u.id}/adjust-balance`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: amt }) }); void load(); }}>调余额</button>
            <button className="rounded border px-2 py-1 text-xs" onClick={async () => { await fetch(`/api/admin/users/${u.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: u.status === 'active' ? 'banned' : 'active' }) }); void load(); }}>{u.status === 'active' ? '封禁' : '解封'}</button>
          </div>,
        ])}
      />
    </AdminShell>
  );
}
