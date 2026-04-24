import { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto min-h-screen max-w-7xl px-4 py-4 md:px-6">{children}</div>;
}
