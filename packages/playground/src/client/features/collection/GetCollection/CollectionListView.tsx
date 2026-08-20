import { useMemo } from 'react';

import { ResultTable } from '@/components/shared';
import { toRows } from '@/features/query';

import { CollectionJSON } from './SingleCollectionDetailed';

interface CollectionListViewProps {
  data: unknown;
  error?: string | null;
}

export function CollectionListView({ data, error }: CollectionListViewProps) {
  const items = useMemo(() => toRows(data), [data]);

  return (
    <ResultTable
      items={items}
      error={error}
      emptyMessage="Collection returned no items"
      renderDetail={(item) => <CollectionJSON item={item} />}
    />
  );
}
