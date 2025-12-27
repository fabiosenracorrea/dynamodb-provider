import { useState } from 'react';
import { Copy, Check, Key, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useResolveEntityKeys, useExecute } from '@/utils/hooks';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { UpdateModal, type UpdateParams } from './UpdateModal';

interface ItemDetailViewProps {
  item: Record<string, unknown>;
  entityType?: string;
  maxHeight?: string;
  onItemDeleted?: () => void;
  onItemUpdated?: (updatedItem: Record<string, unknown>) => void;
}

export function ItemDetailView({
  item,
  entityType,
  maxHeight = 'calc(100vh-150px)',
  onItemDeleted,
  onItemUpdated,
}: ItemDetailViewProps) {
  const [copied, setCopied] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);

  const [resolvedKeys, { isLoading: isLoadingKeys }] = useResolveEntityKeys(entityType, item);

  const deleteMutation = useExecute();
  const updateMutation = useExecute();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!entityType) return;

    try {
      const result = await deleteMutation.mutateAsync({
        target: 'entity',
        name: entityType,
        operation: 'delete',
        params: item,
      });

      if (result.success) {
        setDeleteDialogOpen(false);
        onItemDeleted?.();
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleUpdate = async (updateParams: UpdateParams) => {
    if (!entityType) return;

    try {
      const result = await updateMutation.mutateAsync({
        target: 'entity',
        name: entityType,
        operation: 'update',
        params: {
          ...item,
          ...updateParams,
          returnUpdatedProperties: true,
        },
      });

      if (result.success) {
        setUpdateModalOpen(false);
        if (result.data && typeof result.data === 'object') {
          onItemUpdated?.(result.data as Record<string, unknown>);
        }
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
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

      {/* Action Buttons */}
      {entityType && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUpdateModalOpen(true)}
            className="flex-1"
          >
            <Pencil className="h-4 w-4 mr-2" />
            Update
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
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

      {/* Delete Confirmation Dialog */}
      {entityType && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          entityType={entityType}
          partitionKey={resolvedKeys?.partitionKey}
          rangeKey={resolvedKeys?.rangeKey}
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      )}

      {/* Update Modal */}
      {entityType && (
        <UpdateModal
          open={updateModalOpen}
          onOpenChange={setUpdateModalOpen}
          item={item}
          entityType={entityType}
          onSubmit={handleUpdate}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}
