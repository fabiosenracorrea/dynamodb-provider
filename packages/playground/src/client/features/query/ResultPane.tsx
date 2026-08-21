import { Code2 } from 'lucide-react';

import { CopyButton, JsonView, ResultTable } from '@/components/shared';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import type { ExecuteMeta } from '@/utils/api';

import { ItemDetailView } from '@/features/item';
import type { useOperation } from './useOperation';

type OperationState = ReturnType<typeof useOperation>;

interface ResultPaneProps
  extends Pick<
    OperationState,
    'items' | 'error' | 'meta' | 'hasMore' | 'isLoadingMore' | 'loadMore' | 'hasRun'
  > {
  entityType?: string;
  emptyMessage?: string;
}

function CallSnippet({ meta }: { meta: ExecuteMeta }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 gap-1.5 px-2 text-[11px]">
          <Code2 className="h-3 w-3" />
          as code
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[32rem] p-2">
        <div className="flex items-start gap-2">
          <pre className="scrollbar-slim min-w-0 flex-1 overflow-auto rounded bg-surface p-2 font-mono text-[11px] leading-relaxed">
            {meta.call.code}
          </pre>
          <CopyButton value={meta.call.code} label="Copy snippet" variant="ghost" />
        </div>

        <p className="mt-2 px-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          params sent
        </p>
        <JsonView value={meta.call.params} className="mt-1 max-h-56 border-0" />
      </PopoverContent>
    </Popover>
  );
}

export function ResultPane({
  items,
  error,
  meta,
  hasMore,
  isLoadingMore,
  loadMore,
  hasRun,
  entityType,
  emptyMessage,
}: ResultPaneProps) {
  if (!hasRun) return null;

  return (
    <div className="space-y-2 border-t pt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Result</h4>

        <div className="flex items-center gap-2">
          {meta && (
            <span className="tabular text-[11px] text-muted-foreground">{meta.durationMs}ms</span>
          )}
          {meta && <CallSnippet meta={meta} />}
        </div>
      </div>

      <ResultTable
        items={items}
        error={error}
        entityType={entityType}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        emptyMessage={emptyMessage}
        renderDetail={(item) => (
          <ItemDetailView item={item} entityType={entityType} maxHeight="calc(100vh - 170px)" />
        )}
      />
    </div>
  );
}
