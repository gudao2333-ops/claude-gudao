/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { DataTable } from '@/components/DataTable';
import { MoneyText } from '@/components/MoneyText';

const typeLabel: Record<string, string> = {
  redeem: '兑换码充值',
  pre_hold: '预扣',
  refund_hold: '退回',
  final_charge: '最终扣费',
  extra_deduct: '补扣',
  admin_add: '管理员加余额',
  admin_reduce: '管理员扣余额',
};

export default function BillingPage() {
  const [rows, setRows] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/me').then((r) => (r.ok ? null : router.replace('/login')));
    fetch('/api/balance/logs').then((r) => r.json()).then((d) => setRows(d.data?.items ?? []));
  }, [router]);

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold">余额流水</h1>
      <DataTable headers={['时间', '类型', '金额', '备注']} rows={rows.map((r) => [new Date(r.createdAt).toLocaleString(), typeLabel[r.type] ?? r.type, <MoneyText key={r.id} value={r.amount} />, r.remark ?? '-'])} />
    </AppShell>
  );
}
