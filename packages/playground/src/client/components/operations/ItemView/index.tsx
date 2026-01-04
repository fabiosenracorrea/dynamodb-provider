import { useState, useEffect, useMemo } from 'react';
import { Pencil, Save, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useExecute } from '@/utils/hooks';

import { ItemViewProvider } from './_context';
import { SaveChangesDialog } from './SaveChangesDialog';
import { ItemKey } from './ItemKey';
import { DeleteItemButton } from './DeleteItemButton';
import { UpdateItemButton } from './UpdateItemButton';
import { CopyButton } from './CopyButton';

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
  const [saveChangesDialogOpen, setSaveChangesDialogOpen] = useState(false);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedJson, setEditedJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const directUpdateMutation = useExecute();

  // Format the item JSON
  const formattedJson = useMemo(() => JSON.stringify(item, null, 2), [item]);

  // Reset editing state when item changes
  useEffect(() => {
    setIsEditing(false);
    setEditedJson('');
    setJsonError(null);
  }, [item]);

  // Parse the edited JSON
  const parsedEditedItem = useMemo(() => {
    if (!editedJson.trim()) return null;
    try {
      const parsed = JSON.parse(editedJson);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return null;
      }
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [editedJson]);

  const handleStartEditing = () => {
    setEditedJson(formattedJson);
    setJsonError(null);
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditedJson('');
    setJsonError(null);
  };

  const handleJsonChange = (value: string) => {
    setEditedJson(value);
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setJsonError('Must be a valid JSON object');
      } else {
        setJsonError(null);
      }
    } catch (e) {
      setJsonError('Invalid JSON syntax');
    }
  };

  const handleSaveClick = () => {
    if (jsonError || !parsedEditedItem) return;
    setSaveChangesDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!entityType || !parsedEditedItem) return;

    try {
      // Compute what values to set
      const valuesToSet: Record<string, unknown> = {};
      const keysToRemove: string[] = [];

      // Find added and modified values
      for (const [key, value] of Object.entries(parsedEditedItem)) {
        if (!(key in item) || JSON.stringify(item[key]) !== JSON.stringify(value)) {
          valuesToSet[key] = value;
        }
      }

      // Find removed values
      for (const key of Object.keys(item)) {
        if (!(key in parsedEditedItem)) {
          keysToRemove.push(key);
        }
      }

      const params: Record<string, unknown> = {
        ...item,
        returnUpdatedProperties: true,
      };

      if (Object.keys(valuesToSet).length > 0) {
        params.values = valuesToSet;
      }

      if (keysToRemove.length > 0) {
        params.remove = keysToRemove;
      }

      const result = await directUpdateMutation.mutateAsync({
        target: 'entity',
        name: entityType,
        operation: 'update',
        params,
      });

      if (result.success) {
        setSaveChangesDialogOpen(false);
        setIsEditing(false);
        setEditedJson('');
        if (result.data && typeof result.data === 'object') {
          onItemUpdated?.(result.data as Record<string, unknown>);
        }
      }
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <ItemViewProvider
      item={item}
      entityType={entityType!}
      onItemDeleted={onItemDeleted}
      onItemUpdated={onItemUpdated}
    >
      <TooltipProvider>
        <div className="space-y-4">
          {/* Resolved Keys Section */}
          <ItemKey />

          {/* SET Type Alert */}
          {isEditing && (
            <Alert
              variant="default"
              className="border-amber-500/50 flex items-center gap-2 bg-amber-500/10"
            >
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-900/90">
                <strong>Note:</strong> SET data types (String Set, Number Set, Binary Set)
                are not currently supported in the JSON editor. Only add/remove operations
                are possible via update builder.
              </AlertDescription>
            </Alert>
          )}

          {/* JSON View with Side Actions */}
          <div className="flex gap-2">
            {/* Side Action Buttons */}
            {entityType && (
              <div className="flex flex-col gap-1 shrink-0">
                {/* Copy Button */}
                <CopyButton />

                {/* Edit JSON Button */}
                {!isEditing ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleStartEditing}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Edit JSON directly</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-600 hover:bg-green-500/10"
                          onClick={handleSaveClick}
                          disabled={!!jsonError || !parsedEditedItem}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Save changes</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={handleCancelEditing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Cancel editing</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}

                {/* Update Modal Button */}
                <UpdateItemButton disabled={isEditing} />

                {/* Spacer */}
                <div className="flex-1" />

                {/* Delete Button */}
                <DeleteItemButton disabled={isEditing} />
              </div>
            )}

            {/* JSON View / Editor */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedJson}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    className={`font-mono text-xs min-h-[300px] resize-y ${
                      jsonError ? 'border-destructive focus-visible:ring-destructive' : ''
                    }`}
                    style={{ maxHeight }}
                    placeholder="Enter valid JSON..."
                  />
                  {jsonError && (
                    <div className="text-xs text-destructive">{jsonError}</div>
                  )}
                </div>
              ) : (
                <ScrollArea style={{ maxHeight }} className="border rounded-md">
                  <pre className="json-view text-xs p-3">{formattedJson}</pre>
                </ScrollArea>
              )}
            </div>

            {/* Copy button for non-entity view (no side actions) */}
            {!entityType && (
              <div className="absolute top-2 right-2 z-10">
                <CopyButton variant="ghost" showTooltip={false} />
              </div>
            )}
          </div>

          {/* Save Changes Dialog */}
          {entityType && parsedEditedItem && (
            <SaveChangesDialog
              open={saveChangesDialogOpen}
              onOpenChange={setSaveChangesDialogOpen}
              originalItem={item}
              editedItem={parsedEditedItem}
              onConfirm={handleConfirmSave}
              isLoading={directUpdateMutation.isPending}
            />
          )}
        </div>
      </TooltipProvider>
    </ItemViewProvider>
  );
}
