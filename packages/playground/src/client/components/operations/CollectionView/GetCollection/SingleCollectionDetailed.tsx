import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

import { CopyButton } from './CopyButton';

interface ItemDetailViewProps {
  item: Record<string, unknown>;
  maxHeight?: string;
}

export function CollectionJSON({
  item,
  maxHeight = 'calc(100vh-150px)',
}: ItemDetailViewProps) {
  const formattedJson = useMemo(() => JSON.stringify(item, null, 2), [item]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <ScrollArea style={{ maxHeight }} className="border rounded-md">
            <pre className="json-view text-xs p-3">{formattedJson}</pre>
          </ScrollArea>
        </div>

        <CopyButton variant="ghost" showTooltip={false} />
      </div>
    </div>
  );
}
