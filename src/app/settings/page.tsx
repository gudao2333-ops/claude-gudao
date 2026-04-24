/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { MoneyText } from '@/components/MoneyText';

export default function SettingsPage() {
  const [me, setMe] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/me').then((r) => (r.ok ? r.json().then((d) => setMe(d.data)) : router.replace('/login')));
  }, [router]);

  return (
    <AppShell>
      <div className="mx-auto max-w-xl rounded-2xl border border-stone-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">账号设置</h1>
        <p className="mt-3 text-sm">邮箱：{me?.email ?? '-'}</p>
        <p className="mt-2 text-sm">昵称：{me?.nickname ?? '-'}</p>
        <p className="mt-2 text-sm">余额：<MoneyText value={me?.balance ?? 0} /></p>
        <div className="mt-4 flex gap-3">
          <Link className="rounded-lg border px-3 py-2 text-sm" href="/redeem">兑换码充值</Link>
          <button className="rounded-lg bg-stone-900 px-3 py-2 text-sm text-white" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/login'); }}>退出登录</button>
        </div>
      </div>
    </AppShell>
  );
}
