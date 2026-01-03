import { useMemo } from 'react';
import { Save, Plus, Minus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface Change {
  key: string;
  type: 'added' | 'removed' | 'modified';
  oldValue?: unknown;
  newValue?: unknown;
}

interface SaveChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalItem: Record<string, unknown>;
  editedItem: Record<string, unknown>;
  onConfirm: () => void;
  isLoading?: boolean;
}

function computeDelta(
  original: Record<string, unknown>,
  edited: Record<string, unknown>,
): Change[] {
  const changes: Change[] = [];
  const allKeys = new Set([...Object.keys(original), ...Object.keys(edited)]);

  for (const key of allKeys) {
    const originalValue = original[key];
    const editedValue = edited[key];

    if (!(key in original)) {
      changes.push({ key, type: 'added', newValue: editedValue });
    } else if (!(key in edited)) {
      changes.push({ key, type: 'removed', oldValue: originalValue });
    } else if (JSON.stringify(originalValue) !== JSON.stringify(editedValue)) {
      changes.push({
        key,
        type: 'modified',
        oldValue: originalValue,
        newValue: editedValue,
      });
    }
  }

  return changes.sort((a, b) => {
    const order = { removed: 0, modified: 1, added: 2 };
    return order[a.type] - order[b.type];
  });
}

function formatValue(value: unknown): string {
  if (value === undefined) return 'undefined';
  return JSON.stringify(value, null, 2);
}

function ChangeIcon({ type }: { type: Change['type'] }) {
  switch (type) {
    case 'added':
      return <Plus className="h-3.5 w-3.5 text-green-500" />;
    case 'removed':
      return <Minus className="h-3.5 w-3.5 text-red-500" />;
    case 'modified':
      return <RefreshCw className="h-3.5 w-3.5 text-amber-500" />;
  }
}

function ChangeBadge({ type }: { type: Change['type'] }) {
  const variants: Record<Change['type'], { label: string; className: string }> = {
    added: {
      label: 'Added',
      className: 'bg-green-500/10 text-green-600 border-green-500/20',
    },
    removed: {
      label: 'Removed',
      className: 'bg-red-500/10 text-red-600 border-red-500/20',
    },
    modified: {
      label: 'Modified',
      className: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    },
  };

  const { label, className } = variants[type];
  return (
    <Badge variant="outline" className={`text-[10px] ${className}`}>
      {label}
    </Badge>
  );
}

export function SaveChangesDialog({
  open,
  onOpenChange,
  originalItem,
  editedItem,
  onConfirm,
  isLoading,
}: SaveChangesDialogProps) {
  const changes = useMemo(
    () => computeDelta(originalItem, editedItem),
    [originalItem, editedItem],
  );

  const summary = useMemo(() => {
    const added = changes.filter((c) => c.type === 'added').length;
    const removed = changes.filter((c) => c.type === 'removed').length;
    const modified = changes.filter((c) => c.type === 'modified').length;
    return { added, removed, modified, total: changes.length };
  }, [changes]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Confirm Changes
          </DialogTitle>
          <DialogDescription>
            Review the changes before saving. This will update the item in DynamoDB.
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="flex items-center gap-3 py-2">
          <span className="text-sm text-muted-foreground">Changes:</span>
          {summary.added > 0 && (
            <Badge
              variant="outline"
              className="bg-green-500/10 text-green-600 border-green-500/20"
            >
              +{summary.added} added
            </Badge>
          )}
          {summary.modified > 0 && (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-600 border-amber-500/20"
            >
              {summary.modified} modified
            </Badge>
          )}
          {summary.removed > 0 && (
            <Badge
              variant="outline"
              className="bg-red-500/10 text-red-600 border-red-500/20"
            >
              -{summary.removed} removed
            </Badge>
          )}
        </div>

        {/* Changes List */}
        <ScrollArea className="flex-1 max-h-[400px]">
          <div className="space-y-3">
            {changes.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No changes detected
              </div>
            ) : (
              changes.map((change) => (
                <div
                  key={change.key}
                  className="border rounded-md p-3 bg-muted/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ChangeIcon type={change.type} />
                      <code className="font-mono text-sm font-medium">{change.key}</code>
                    </div>
                    <ChangeBadge type={change.type} />
                  </div>

                  {change.type === 'modified' && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <span className="text-muted-foreground">Before:</span>
                        <pre className="font-mono bg-red-500/5 border border-red-500/10 p-2 rounded text-red-600 dark:text-red-400 overflow-x-auto">
                          {formatValue(change.oldValue)}
                        </pre>
                      </div>
                      <div className="space-y-1">
                        <span className="text-muted-foreground">After:</span>
                        <pre className="font-mono bg-green-500/5 border border-green-500/10 p-2 rounded text-green-600 dark:text-green-400 overflow-x-auto">
                          {formatValue(change.newValue)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {change.type === 'added' && (
                    <div className="text-xs space-y-1">
                      <span className="text-muted-foreground">Value:</span>
                      <pre className="font-mono bg-green-500/5 border border-green-500/10 p-2 rounded text-green-600 dark:text-green-400 overflow-x-auto">
                        {formatValue(change.newValue)}
                      </pre>
                    </div>
                  )}

                  {change.type === 'removed' && (
                    <div className="text-xs space-y-1">
                      <span className="text-muted-foreground">Removed value:</span>
                      <pre className="font-mono bg-red-500/5 border border-red-500/10 p-2 rounded text-red-600 dark:text-red-400 overflow-x-auto line-through">
                        {formatValue(change.oldValue)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading || changes.length === 0}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
