'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

export default function LoginPage() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/me').then((r) => (r.ok ? router.replace('/chat') : null));
  }, [router]);

  return (
    <AppShell>
      <div className="mx-auto mt-12 max-w-md rounded-2xl border border-stone-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">登录</h1>
        <p className="mt-2 text-sm text-stone-500">邮箱 + 密码登录</p>
        <input className="mt-4 w-full rounded-lg border px-3 py-2" placeholder="邮箱" value={account} onChange={(e) => setAccount(e.target.value)} />
        <input className="mt-3 w-full rounded-lg border px-3 py-2" placeholder="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
        <button
          className="mt-4 w-full rounded-lg bg-stone-900 px-3 py-2 text-white"
          onClick={async () => {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ account, password }),
            });
            const data = await res.json();
            if (!data.success) return setError(data.error?.message ?? '登录失败');
            router.replace('/chat');
          }}
        >
          登录
        </button>
        <p className="mt-4 text-sm">没有账号？<Link className="text-stone-900 underline" href="/register">去注册</Link></p>
      </div>
    </AppShell>
  );
}
