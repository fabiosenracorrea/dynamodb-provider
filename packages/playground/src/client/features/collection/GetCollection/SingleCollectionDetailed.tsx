import { JsonView, CopyButton } from '@/components/shared';

interface CollectionJSONProps {
  item: Record<string, unknown>;
  maxHeight?: string;
}

export function CollectionJSON({ item, maxHeight = 'calc(100vh - 170px)' }: CollectionJSONProps) {
  return (
    <div className="flex gap-2">
      <div className="min-w-0 flex-1">
        <JsonView value={item} className="scrollbar-slim" style={{ maxHeight }} />
      </div>

      <CopyButton value={item} showTooltip={false} />
    </div>
  );
}
