'use client';

import { useMemo, useState } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

type Conversation = { id: string; title: string; updatedAt: string };

export function ChatSidebar({
  conversations,
  currentId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
}: {
  conversations: Conversation[];
  currentId?: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(
    () => conversations.filter((c) => c.title.toLowerCase().includes(keyword.toLowerCase())),
    [conversations, keyword],
  );

  return (
    <aside className="w-full rounded-2xl border border-stone-200 bg-white p-3 md:w-72">
      <button className="w-full rounded-lg bg-stone-900 px-3 py-2 text-sm text-white" onClick={onCreate}>新建对话</button>
      <input
        className="mt-3 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
        placeholder="搜索会话"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <div className="mt-3 space-y-2">
        {filtered.map((c) => (
          <div key={c.id} className={`rounded-lg border p-2 ${currentId === c.id ? 'border-stone-800' : 'border-stone-200'}`}>
            <button className="w-full text-left text-sm font-medium" onClick={() => onSelect(c.id)}>{c.title}</button>
            <div className="mt-2 flex gap-2 text-xs">
              <button onClick={() => {
                const next = prompt('重命名会话', c.title);
                if (next) onRename(c.id, next);
              }}>重命名</button>
              <button className="text-rose-600" onClick={() => setDeleteId(c.id)}>删除</button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="删除会话？"
        description="删除后无法恢复。"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) onDelete(deleteId);
          setDeleteId(null);
        }}
      />
    </aside>
  );
}
