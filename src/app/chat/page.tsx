'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ChatSidebar } from '@/components/ChatSidebar';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { ModelSelector } from '@/components/ModelSelector';
import { BalanceBadge } from '@/components/BalanceBadge';
import { RedeemDialog } from '@/components/RedeemDialog';
import { MoneyText } from '@/components/MoneyText';

type Conv = { id: string; title: string; updatedAt: string };
type Msg = { role: 'user' | 'assistant'; content: string };

type Model = { modelKey: string; name: string; description?: string };

export default function ChatPage() {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [currentId, setCurrentId] = useState<string>();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [modelKey, setModelKey] = useState('');
  const [balance, setBalance] = useState('0');
  const [costTip, setCostTip] = useState('');
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [buyUrl, setBuyUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const currentConv = useMemo(() => conversations.find((c) => c.id === currentId), [conversations, currentId]);

  async function refreshMe() {
    const meRes = await fetch('/api/me');
    if (!meRes.ok) return router.replace('/login');
    const meData = await meRes.json();
    setBalance(String(meData.data?.balance ?? '0'));
  }

  async function refreshConversations() {
    const res = await fetch('/api/conversations');
    const data = await res.json();
    if (data.success) {
      setConversations(data.data ?? []);
      if (!currentId && data.data?.[0]) setCurrentId(data.data[0].id);
    }
  }

  useEffect(() => {
    fetch('/api/me').then((r) => (r.ok ? r.json().then((d) => setBalance(String(d.data?.balance ?? '0'))) : router.replace('/login')));
    fetch('/api/public/settings').then((r) => r.json()).then((d) => setBuyUrl(d.data?.redeem_buy_url ?? ''));
    fetch('/api/models').then((r) => r.json()).then((d) => {
      const list = d.data ?? [];
      setModels(list);
      if (list[0]) setModelKey(list[0].modelKey);
    });
    fetch('/api/conversations').then((r) => r.json()).then((data) => {
      if (data.success) {
        setConversations(data.data ?? []);
        if (!currentId && data.data?.[0]) setCurrentId(data.data[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (!currentId) return;
    fetch(`/api/conversations/${currentId}/messages`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const mapped: Msg[] = (d.data ?? []).map((m: Record<string, unknown>) => ({ role: (m.role === 'assistant' ? 'assistant' : 'user'), content: String(m.content ?? '') }));
          setMessages(mapped);
        }
      });
  }, [currentId]);

  const send = async () => {
    if (!input.trim() || !modelKey) return;
    setLoading(true);
    const userMsg: Msg = { role: 'user', content: input };
    const next: Msg[] = [...messages, userMsg, { role: 'assistant', content: '' }];
    setMessages(next);
    setInput('');
    setCostTip('');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelKey, conversationId: currentId, messages: [...messages, userMsg] }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error('当前模型暂不可用');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const cp = [...prev];
          cp[cp.length - 1] = { role: 'assistant', content: answer };
          return cp;
        });
      }

      await refreshConversations();
      await refreshMe();
      setCostTip('回复完成，可在账单查看本次消耗。');
    } catch (e) {
      setMessages((prev) => prev.slice(0, -1));
      alert((e as Error).message || '请求失败');
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ModelSelector models={models} value={modelKey} onChange={setModelKey} />
          {currentConv ? <span className="text-sm text-stone-500">{currentConv.title}</span> : null}
        </div>
        <div className="flex items-center gap-2">
          <BalanceBadge balance={balance} />
          <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => setRedeemOpen(true)}>兑换码充值</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <ChatSidebar
          conversations={conversations}
          currentId={currentId}
          onSelect={setCurrentId}
          onCreate={async () => {
            const res = await fetch('/api/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: '新对话', modelKey }) });
            const data = await res.json();
            if (data.success) {
              setCurrentId(data.data.id);
              fetch('/api/conversations').then((r) => r.json()).then((data) => {
      if (data.success) {
        setConversations(data.data ?? []);
        if (!currentId && data.data?.[0]) setCurrentId(data.data[0].id);
      }
    });
            }
          }}
          onDelete={async (id) => {
            await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
            if (currentId === id) setCurrentId(undefined);
            fetch('/api/conversations').then((r) => r.json()).then((data) => {
      if (data.success) {
        setConversations(data.data ?? []);
        if (!currentId && data.data?.[0]) setCurrentId(data.data[0].id);
      }
    });
          }}
          onRename={async (id, title) => {
            await fetch(`/api/conversations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
            fetch('/api/conversations').then((r) => r.json()).then((data) => {
      if (data.success) {
        setConversations(data.data ?? []);
        if (!currentId && data.data?.[0]) setCurrentId(data.data[0].id);
      }
    });
          }}
        />

        <div className="space-y-4">
          <div className="h-[60vh] space-y-3 overflow-y-auto rounded-2xl border border-stone-200 bg-stone-50 p-4">
            {messages.length === 0 ? <p className="text-sm text-stone-500">开始一个新对话吧。</p> : messages.map((m, i) => <ChatMessage key={i} role={m.role} content={m.content} />)}
          </div>

          <ChatInput value={input} onChange={setInput} onSend={send} onStop={() => abortRef.current?.abort()} loading={loading} />
          {costTip ? <p className="text-sm text-stone-600">{costTip}</p> : null}
          {Number(balance) <= 0 ? (
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
              余额不足，请先兑换充值。
              {buyUrl ? <a className="ml-2 underline" href={buyUrl} target="_blank">没有兑换码？前往购买</a> : null}
            </div>
          ) : null}
          <p className="text-sm text-stone-500">当前余额：<MoneyText value={balance} /></p>
        </div>
      </div>

      <RedeemDialog open={redeemOpen} onClose={() => setRedeemOpen(false)} onSuccess={refreshMe} />
    </AppShell>
  );
}
