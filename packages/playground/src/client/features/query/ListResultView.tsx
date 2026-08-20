import { useMemo } from 'react';

import { ResultTable, type Row } from '@/components/shared';

import { ItemDetailView } from '@/features/item';

interface ListResultViewProps {
  data: unknown;
  error?: string | null;
  entityType?: string;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

/** Accepts either a bare array or a `{ items }` result. */
export function toRows(data: unknown): Row[] {
  if (Array.isArray(data)) return data as Row[];

  if (data && typeof data === 'object' && 'items' in data) {
    return ((data as { items: unknown[] }).items ?? []) as Row[];
  }

  return [];
}

export function ListResultView({ data, error, entityType, ...pagination }: ListResultViewProps) {
  const items = useMemo(() => toRows(data), [data]);

  return (
    <ResultTable
      items={items}
      error={error}
      entityType={entityType}
      {...pagination}
      renderDetail={(item) => (
        <ItemDetailView item={item} entityType={entityType} maxHeight="calc(100vh - 170px)" />
      )}
    />
  );
}
