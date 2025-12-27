import { useState } from 'react';
import { Copy, Check, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useResolveEntityKeys } from '@/utils/hooks';

interface ItemDetailViewProps {
  item: Record<string, unknown>;
  entityType?: string;
  maxHeight?: string;
}

export function ItemDetailView({
  item,
  entityType,
  maxHeight = 'calc(100vh-150px)',
}: ItemDetailViewProps) {
  const [copied, setCopied] = useState(false);

  const [resolvedKeys, { isLoading: isLoadingKeys }] = useResolveEntityKeys(
    entityType,
    item,
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Resolved Keys Section */}
      {entityType && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Key className="h-4 w-4" />
            <span>Keys</span>
          </div>
          {isLoadingKeys ? (
            <div className="text-xs text-muted-foreground">Loading keys...</div>
          ) : resolvedKeys?.success ? (
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
          ) : resolvedKeys?.error ? (
            <div className="text-xs text-destructive">{resolvedKeys.error}</div>
          ) : null}
        </div>
      )}

      {/* JSON View */}
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <ScrollArea style={{ maxHeight }}>
          <pre className="json-view text-xs">{JSON.stringify(item, null, 2)}</pre>
        </ScrollArea>
      </div>
    </div>
  );
}
