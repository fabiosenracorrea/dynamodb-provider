import { useState } from 'react';
import { Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useExecute } from '@/utils/hooks';
import { useMetadataContext } from '@/context';

import { UpdateModal, type UpdateParams } from './UpdateModal';
import { useItemContext } from './_context';

interface UpdateItemButtonProps {
  disabled?: boolean;
}

export function UpdateItemButton({ disabled }: UpdateItemButtonProps) {
  const { metadata } = useMetadataContext();

  const { item, entityType, onItemUpdated } = useItemContext();
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const updateMutation = useExecute();

  if (!entityType || !metadata?.isUpdateEnabled) {
    return null;
  }

  const handleUpdate = async (updateParams: UpdateParams) => {
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
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setUpdateModalOpen(true)}
            disabled={disabled}
          >
            <Wrench className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Update builder</p>
        </TooltipContent>
      </Tooltip>

      <UpdateModal
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        item={item}
        entityType={entityType}
        onSubmit={handleUpdate}
        isLoading={updateMutation.isPending}
      />
    </>
  );
}
