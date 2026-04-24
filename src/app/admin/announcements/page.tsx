/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';
import { DataTable } from '@/components/DataTable';

export default function AdminAnnouncementsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => {
    const d = await fetch('/api/admin/announcements').then((r) => r.json());
    setRows(d.data ?? []);
  };
  useEffect(() => { void load(); }, []);

  return (
    <AdminShell>
      <div className="mb-4 flex justify-between">
        <h1 className="text-2xl font-semibold">公告管理</h1>
        <button className="rounded border px-3 py-2" onClick={async () => { const title = prompt('标题'); const content = prompt('内容'); const type = prompt('类型 global/dashboard/maintenance/model', 'global'); if (!title || !content || !type) return; await fetch('/api/admin/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content, type }) }); void load(); }}>新增</button>
      </div>
      <DataTable headers={['标题', '类型', '启用', '操作']} rows={rows.map((a) => [a.title, a.type, String(a.enabled), <div key={a.id} className="flex gap-2"><button className="rounded border px-2 py-1 text-xs" onClick={async () => { await fetch(`/api/admin/announcements/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !a.enabled }) }); void load(); }}>启用/禁用</button><button className="rounded border px-2 py-1 text-xs" onClick={async () => { await fetch(`/api/admin/announcements/${a.id}`, { method: 'DELETE' }); void load(); }}>删除</button></div>] )} />
    </AdminShell>
  );
}
