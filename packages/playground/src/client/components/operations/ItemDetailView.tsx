import { useState, useEffect, useMemo } from 'react';
import { Copy, Check, Key, Trash2, Pencil, Save, X, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { useResolveEntityKeys, useExecute } from '@/utils/hooks';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { UpdateModal, type UpdateParams } from './UpdateModal';
import { SaveChangesDialog } from './SaveChangesDialog';

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
  const [saveChangesDialogOpen, setSaveChangesDialogOpen] = useState(false);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editedJson, setEditedJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const [resolvedKeys, { isLoading: isLoadingKeys }] = useResolveEntityKeys(
    entityType,
    item,
  );

  const deleteMutation = useExecute();
  const updateMutation = useExecute();
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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <TooltipProvider>
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
                  <span className="text-muted-foreground min-w-[80px]">
                    Partition Key:
                  </span>
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

        {/* JSON View with Side Actions */}
        <div className="flex gap-2">
          {/* Side Action Buttons */}
          {entityType && (
            <div className="flex flex-col gap-1 shrink-0">
              {/* Copy Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Copy JSON</p>
                </TooltipContent>
              </Tooltip>

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
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setUpdateModalOpen(true)}
                    disabled={isEditing}
                  >
                    <Wrench className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Update builder</p>
                </TooltipContent>
              </Tooltip>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Delete Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={isEditing}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Delete item</p>
                </TooltipContent>
              </Tooltip>
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
                {jsonError && <div className="text-xs text-destructive">{jsonError}</div>}
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
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
  );
}
