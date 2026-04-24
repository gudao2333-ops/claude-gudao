'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [registerEnabled, setRegisterEnabled] = useState(true);

  useEffect(() => {
    fetch('/api/me').then((r) => (r.ok ? router.replace('/chat') : null));
    fetch('/api/public/settings')
      .then((r) => r.json())
      .then((d) => setRegisterEnabled(d.data?.allow_register !== 'false'));
  }, [router]);

  return (
    <AppShell>
      <div className="mx-auto mt-12 max-w-md rounded-2xl border border-stone-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">注册</h1>
        {!registerEnabled ? (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">暂未开放注册</p>
        ) : (
          <>
            <input className="mt-4 w-full rounded-lg border px-3 py-2" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="mt-3 w-full rounded-lg border px-3 py-2" placeholder="昵称" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            <input className="mt-3 w-full rounded-lg border px-3 py-2" placeholder="密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
            <button
              className="mt-4 w-full rounded-lg bg-stone-900 px-3 py-2 text-white"
              onClick={async () => {
                const res = await fetch('/api/auth/register', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password, nickname }),
                });
                const data = await res.json();
                if (!data.success) return setError(data.error?.message ?? '注册失败');
                router.replace('/chat');
              }}
            >
              注册
            </button>
          </>
        )}
        <p className="mt-4 text-sm">已有账号？<Link className="underline" href="/login">去登录</Link></p>
      </div>
    </AppShell>
  );
}
