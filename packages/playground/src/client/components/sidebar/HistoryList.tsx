import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Trash2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EntityDot } from '@/components/shared';
import { clearHistory, useHistory, type HistoryEntry } from '@/features/query';

function timeOf(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Where re-running an entry should land you. */
function routeFor({ request }: HistoryEntry): string | null {
  if (request.target === 'entity') return `/entity/${encodeURIComponent(request.name)}`;
  if (request.target === 'collection') return `/collection/${encodeURIComponent(request.name)}`;

  return null;
}

export function HistoryList() {
  const history = useHistory();
  const navigate = useNavigate();

  if (!history.length) {
    return (
      <p className="px-3 py-6 text-center text-xs text-muted-foreground">
        Nothing run yet. Queries you execute show up here for the session.
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {history.length} run{history.length === 1 ? '' : 's'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-[11px]"
          onClick={clearHistory}
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-2 pt-0">
          {history.map((entry) => {
            const route = routeFor(entry);

            return (
              <button
                key={entry.id}
                type="button"
                disabled={!route}
                onClick={() => route && navigate(route)}
                className="w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/60 disabled:cursor-default disabled:opacity-70"
              >
                <div className="flex items-center gap-1.5">
                  {entry.ok ? (
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-success" />
                  ) : (
                    <XCircle className="h-3 w-3 shrink-0 text-destructive" />
                  )}

                  {entry.request.target === 'entity' && <EntityDot type={entry.request.name} />}

                  <span className="truncate font-mono text-[11px]">{entry.label}</span>
                </div>

                <div className="mt-0.5 flex items-center gap-2 pl-4 text-[10px] text-muted-foreground">
                  <span className="tabular">{timeOf(entry.at)}</span>
                  {entry.ok ? (
                    <>
                      {entry.count !== undefined && (
                        <span className="tabular">{entry.count} items</span>
                      )}
                      {entry.durationMs !== undefined && (
                        <span className="tabular">{entry.durationMs}ms</span>
                      )}
                    </>
                  ) : (
                    <span className="truncate text-destructive/80">{entry.error}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
