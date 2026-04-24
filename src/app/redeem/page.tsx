'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { MoneyText } from '@/components/MoneyText';

export default function RedeemPage() {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [amount, setAmount] = useState('0');
  const [balance, setBalance] = useState('0');
  const [buyUrl, setBuyUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/me').then((r) => (r.ok ? r.json().then((d) => setBalance(String(d.data?.balance ?? '0'))) : router.replace('/login')));
    fetch('/api/public/settings').then((r) => r.json()).then((d) => setBuyUrl(d.data?.redeem_buy_url ?? ''));
  }, [router]);

  return (
    <AppShell>
      <div className="mx-auto max-w-lg rounded-2xl border border-stone-200 bg-white p-6">
        <h1 className="text-2xl font-semibold">兑换码充值</h1>
        <input className="mt-4 w-full rounded-lg border px-3 py-2" value={code} onChange={(e) => setCode(e.target.value)} placeholder="输入兑换码" />
        <button
          className="mt-3 rounded-lg bg-stone-900 px-4 py-2 text-white"
          onClick={async () => {
            const res = await fetch('/api/redeem-code/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
            const data = await res.json();
            if (data.success) {
              setMsg(data.message);
              setAmount(String(data.data.amount));
              setBalance(String(data.data.balance));
            } else {
              setMsg(data.error?.message ?? '兑换失败');
            }
          }}
        >
          立即兑换
        </button>
        {msg ? <p className="mt-3 text-sm">{msg}</p> : null}
        <p className="mt-2 text-sm">兑换金额：<MoneyText value={amount} /></p>
        <p className="mt-2 text-sm">当前余额：<MoneyText value={balance} /></p>
        {buyUrl ? <a href={buyUrl} target="_blank" className="mt-4 inline-block text-sm underline">没有兑换码？前往购买</a> : null}
      </div>
    </AppShell>
  );
}
