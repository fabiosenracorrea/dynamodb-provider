import { Key } from 'lucide-react';
import { useResolveEntityKeys } from '@/utils/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { useItemContext } from './_context';

export function ItemKey() {
  const { item, entityType } = useItemContext();

  const [resolvedKeys, { isLoading: isLoadingKeys }] = useResolveEntityKeys(entityType, item);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Key className="h-4 w-4" />
        <span>Keys</span>
      </div>

      {isLoadingKeys && <Skeleton className="h-9 w-40" />}

      {resolvedKeys?.error && <div className="text-xs text-destructive">{resolvedKeys.error}</div>}

      {resolvedKeys?.success && (
        <div className="grid gap-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="min-w-[80px] text-muted-foreground">Partition Key:</span>
            <code className="rounded bg-muted px-2 py-0.5 font-mono">
              {resolvedKeys.partitionKey}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="min-w-[80px] text-muted-foreground">Range Key:</span>
            <code className="rounded bg-muted px-2 py-0.5 font-mono">{resolvedKeys.rangeKey}</code>
          </div>
        </div>
      )}
    </div>
  );
}
