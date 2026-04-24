'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { DataTable } from '@/components/DataTable';

export default function AdminDashboardPage() {
  const [data, setData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetch('/api/admin/dashboard').then((r) => r.json()).then((d) => setData(d.data ?? {}));
  }, []);

  return (
    <AdminShell>
      <h1 className="mb-4 text-2xl font-semibold">数据看板</h1>
      <DataTable
        headers={['指标', '数值']}
        rows={[
          ['用户总数', String(data.users ?? 0)],
          ['模型数', String(data.models ?? 0)],
          ['账单数', String(data.bills ?? 0)],
          ['累计消费', String(data.totalUserCostCny ?? 0)],
        ]}
      />
    </AdminShell>
  );
}
