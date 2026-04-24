/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { MoneyText } from '@/components/MoneyText';
import { StatusBadge } from '@/components/StatusBadge';

export default function BillsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/me').then((r) => (r.ok ? null : router.replace('/login')));
    fetch('/api/bills').then((r) => r.json()).then((d) => setRows(d.data?.items ?? []));
  }, [router]);

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold">对话账单</h1>
      <DataTable
        headers={['时间', '模型', '金额', '状态', '详情']}
        rows={rows.map((r) => [
          new Date(r.createdAt).toLocaleString(),
          r.modelKey,
          <MoneyText key={r.id} value={r.userCostCny} />,
          <StatusBadge key={`${r.id}-s`} status={r.status} />,
          <details key={`${r.id}-d`}><summary>查看 token</summary><div className="text-xs text-stone-600">输入 {r.promptTokens} / 输出 {r.completionTokens} / 总计 {r.totalTokens}</div></details>,
        ])}
      />
    </AppShell>
  );
}
