import Link from 'next/link';
import { ReactNode } from 'react';
import { AppShell } from './AppShell';

const links = [
  ['/admin', '看板'],
  ['/admin/users', '用户'],
  ['/admin/models', '模型'],
  ['/admin/channels', '渠道'],
  ['/admin/bills', '账单'],
  ['/admin/balance-logs', '流水'],
  ['/admin/redeem-codes', '兑换码'],
  ['/admin/settings', '设置'],
  ['/admin/newapi', 'NewAPI'],
  ['/admin/announcements', '公告'],
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-stone-200 bg-white p-3">
          <h2 className="px-2 pb-2 text-sm font-semibold">管理后台</h2>
          <nav className="space-y-1">
            {links.map(([href, label]) => (
              <Link key={href} href={href} className="block rounded-lg px-2 py-2 text-sm hover:bg-stone-100">
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </AppShell>
  );
}
