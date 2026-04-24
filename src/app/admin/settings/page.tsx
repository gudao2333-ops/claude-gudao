/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/AdminShell';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState(false);

  const load = async () => {
    const d = await fetch('/api/admin/settings').then((r) => r.json());
    setSettings(d.data ?? {});
  };
  useEffect(() => { void load(); }, []);

  const update = async (key: string, value: string) => {
    if (key === 'newapi_api_key' && !confirm('确认修改 NewAPI Key？')) return;
    await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: value }) });
    void load();
  };

  return (
    <AdminShell>
      <h1 className="mb-4 text-2xl font-semibold">系统设置</h1>
      <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
        {Object.entries(settings).map(([k, v]) => (
          <div key={k} className="grid gap-2 md:grid-cols-[220px_1fr_auto] md:items-center">
            <label className="text-sm text-stone-600">{k}</label>
            <input className="rounded border px-3 py-2 text-sm" defaultValue={k === 'newapi_api_key' && !showKey ? '******' : String(v ?? '')} onBlur={(e) => update(k, e.target.value)} />
            {k === 'newapi_api_key' ? <button className="text-xs underline" onClick={() => setShowKey((s) => !s)}>{showKey ? '隐藏' : '显示'}</button> : <span />}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
