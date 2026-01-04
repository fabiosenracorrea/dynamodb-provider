import { useState } from 'react';
import { Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useExecute } from '@/utils/hooks';

import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { useItemContext } from './_context';

interface DeleteItemButtonProps {
  disabled?: boolean;
}

export function DeleteItemButton({ disabled }: DeleteItemButtonProps) {
  const { item, entityType, onItemDeleted } = useItemContext();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteMutation = useExecute();

  if (!entityType) {
    return null;
  }

  const handleDelete = async () => {
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

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Delete item</p>
        </TooltipContent>
      </Tooltip>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
