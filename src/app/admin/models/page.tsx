/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { DataTable } from '@/components/DataTable';

export default function AdminModelsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => {
    const d = await fetch('/api/admin/models').then((r) => r.json());
    setRows(d.data ?? []);
  };
  useEffect(() => { void load(); }, []);

  return (
    <AdminShell>
      <div className="mb-4 flex justify-between">
        <h1 className="text-2xl font-semibold">模型管理</h1>
        <button className="rounded-lg bg-stone-900 px-3 py-2 text-sm text-white" onClick={async () => { const name = prompt('展示名称'); const modelKey = prompt('模型别名 modelKey'); const newapiModelName = prompt('真实模型名 newapiModelName'); if (!name || !modelKey || !newapiModelName) return; await fetch('/api/admin/models', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, modelKey, newapiModelName }) }); void load(); }}>新增模型</button>
      </div>
      <DataTable headers={['name', 'modelKey', 'newapiModelName', 'billingMode', 'enabled', 'visible']} rows={rows.map((m) => [m.name, m.modelKey, m.newapiModelName, m.billingMode, String(m.enabled), String(m.visible)])} />
    </AdminShell>
  );
}
