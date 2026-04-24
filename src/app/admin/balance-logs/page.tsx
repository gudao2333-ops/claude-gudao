/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { DataTable } from '@/components/DataTable';
import { MoneyText } from '@/components/MoneyText';

export default function AdminBalanceLogsPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { fetch('/api/admin/balance-logs').then((r) => r.json()).then((d) => setRows(d.data?.items ?? [])); }, []);

  return (
    <AdminShell>
      <h1 className="mb-4 text-2xl font-semibold">余额流水</h1>
      <DataTable headers={['用户', '类型', '金额', '时间']} rows={rows.map((l) => [l.userId, l.type, <MoneyText key={l.id} value={l.amount} />, new Date(l.createdAt).toLocaleString()])} />
    </AdminShell>
  );
}
