import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useResolveEntityKeys } from '@/utils/hooks';
import { useItemContext } from './_context';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: DeleteConfirmDialogProps) {
  const { entityType, item } = useItemContext();

  const [resolvedKeys] = useResolveEntityKeys(entityType, item);

  const { partitionKey, rangeKey } = resolvedKeys ?? {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Item
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this item? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Entity:</span>
            <Badge variant="secondary" className="font-mono">
              {entityType}
            </Badge>
          </div>

          {partitionKey && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Partition Key:</span>
              <code className="block font-mono text-xs bg-muted px-2 py-1 rounded">
                {partitionKey}
              </code>
            </div>
          )}

          {rangeKey && (
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Range Key:</span>
              <code className="block font-mono text-xs bg-muted px-2 py-1 rounded">
                {rangeKey}
              </code>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
