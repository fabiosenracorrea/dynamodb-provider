import { Key } from 'lucide-react';
import { useResolveEntityKeys } from '@/utils/hooks';
import { Skeleton } from '@/components/ui/skeleton';

interface ItemKeyProps {
  item: Record<string, unknown>;
  entityType: string;
}

export function ItemKey({ item, entityType }: ItemKeyProps) {
  const [resolvedKeys, { isLoading: isLoadingKeys }] = useResolveEntityKeys(
    entityType,
    item,
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Key className="h-4 w-4" />
        <span>Keys</span>
      </div>

      {isLoadingKeys && <Skeleton className="w-40 h-9" />}

      {resolvedKeys?.error && (
        <div className="text-xs text-destructive">{resolvedKeys.error}</div>
      )}

      {resolvedKeys?.success && (
        <div className="grid gap-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground min-w-[80px]">Partition Key:</span>
            <code className="font-mono bg-muted px-2 py-0.5 rounded">
              {resolvedKeys.partitionKey}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground min-w-[80px]">Range Key:</span>
            <code className="font-mono bg-muted px-2 py-0.5 rounded">
              {resolvedKeys.rangeKey}
            </code>
          </div>
        </div>
      )}
    </div>
  );
}
