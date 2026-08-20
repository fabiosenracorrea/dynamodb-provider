import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Command } from 'lucide-react';

import { Sidebar } from '@/components/sidebar';
import { ThemeToggle } from '@/components/shared';
import { useMetadataContext } from '@/context';

import { ConnectionBadge } from './ConnectionBadge';

function KeyHint() {
  return (
    <span className="hidden items-center gap-1 rounded border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:flex">
      <Command className="h-3 w-3" />K
    </span>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const { table } = useMetadataContext();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-surface px-4">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">Playground</span>
          <span className="font-mono text-[11px] text-muted-foreground">
            {table?.partitionKey} / {table?.rangeKey}
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <KeyHint />
          <ConnectionBadge />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <Sidebar />

        <main className="scrollbar-slim min-w-0 flex-1 overflow-auto p-5">{children}</main>
      </div>
    </div>
  );
}
