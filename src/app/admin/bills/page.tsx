/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { DataTable } from '@/components/DataTable';
import { MoneyText } from '@/components/MoneyText';
import { StatusBadge } from '@/components/StatusBadge';

export default function AdminBillsPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { fetch('/api/admin/bills').then((r) => r.json()).then((d) => setRows(d.data?.items ?? [])); }, []);

  return (
    <AdminShell>
      <h1 className="mb-4 text-2xl font-semibold">账单管理</h1>
      <DataTable
        headers={['用户', '模型', '成本', '扣费', '利润', '状态', '详情']}
        rows={rows.map((b) => [b.userId, b.newapiModelName, <MoneyText key={`${b.id}c`} value={b.costCny} />, <MoneyText key={`${b.id}u`} value={b.userCostCny} />, <MoneyText key={`${b.id}p`} value={b.profitCny} />, <StatusBadge key={`${b.id}s`} status={b.status} />, <details key={b.id}><summary>usage/quota</summary><pre className="text-xs">{JSON.stringify({ quota: b.quota, rawUsage: b.rawUsage }, null, 2)}</pre></details>] )}
      />
    </AdminShell>
  );
}
