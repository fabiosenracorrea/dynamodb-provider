import { useState, useMemo } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ListResultView } from './ListResultView';
import { useExecute } from '@/utils/hooks';
import type { ExecuteRequest, KeyPiece } from '@/utils/api';

interface BatchGetFormProps {
  target: ExecuteRequest['target'];
  name: string;
  description?: string;
  partitionKey: KeyPiece[];
  rangeKey: KeyPiece[];
}

interface KeyEntry {
  id: string;
  values: Record<string, string>;
}

export function BatchGetForm({
  target,
  name,
  description,
  partitionKey,
  rangeKey,
}: BatchGetFormProps) {
  // Extract variable names from keys
  const variables = useMemo(() => {
    const vars: Array<{ name: string; source: 'partition' | 'range'; numeric: boolean }> =
      [];
    const seen = new Set<string>();

    partitionKey.forEach((piece) => {
      if (piece.type === 'VARIABLE' && !seen.has(piece.value)) {
        seen.add(piece.value);
        vars.push({
          name: piece.value,
          source: 'partition',
          numeric: piece.numeric ?? false,
        });
      }
    });

    rangeKey.forEach((piece) => {
      if (piece.type === 'VARIABLE' && !seen.has(piece.value)) {
        seen.add(piece.value);
        vars.push({
          name: piece.value,
          source: 'range',
          numeric: piece.numeric ?? false,
        });
      }
    });

    return vars;
  }, [partitionKey, rangeKey]);

  // Initialize with one empty key entry
  const createEmptyEntry = (): KeyEntry => ({
    id: crypto.randomUUID(),
    values: Object.fromEntries(variables.map((v) => [v.name, ''])),
  });

  const [entries, setEntries] = useState<KeyEntry[]>([createEmptyEntry()]);

  const mutation = useExecute();

  const handleChange = (entryId: string, varName: string, value: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? { ...entry, values: { ...entry.values, [varName]: value } }
          : entry,
      ),
    );
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, createEmptyEntry()]);
  };

  const removeEntry = (entryId: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
  };

  const handleExecute = () => {
    // Convert all entries to params arrays
    const keys = entries.map((entry) => {
      const params: Record<string, unknown> = {};
      variables.forEach((v) => {
        const val = entry.values[v.name];
        if (v.numeric && val) {
          params[v.name] = Number(val);
        } else {
          params[v.name] = val;
        }
      });
      return params;
    });

    mutation.mutate({
      target,
      name,
      operation: 'batchGet',
      params: { keys },
    });
  };

  // Check if all entries have valid values
  const isValid =
    entries.length > 0 &&
    entries.every((entry) => variables.every((v) => entry.values[v.name]?.trim() !== ''));

  const result = mutation.data?.success ? mutation.data.data : null;
  const error = mutation.data?.success === false ? mutation.data.error : null;

  return (
    <div className="space-y-4">
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      {variables.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No parameters required - key uses only constant values
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="flex gap-2 items-start p-3 border rounded-lg bg-muted/30"
            >
              <div className="flex-1 grid gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Key {index + 1}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {variables.map((variable) => (
                    <div key={variable.name}>
                      <label className="text-xs font-medium mb-1 flex items-center gap-1.5">
                        <span>{variable.name}</span>
                        <span className="text-muted-foreground font-normal">
                          ({variable.source}
                          {variable.numeric ? ', n' : ''})
                        </span>
                      </label>
                      <Input
                        type={variable.numeric ? 'number' : 'text'}
                        value={entry.values[variable.name]}
                        onChange={(e) =>
                          handleChange(entry.id, variable.name, e.target.value)
                        }
                        placeholder={variable.name}
                        className="font-mono h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
              {entries.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeEntry(entry.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 items-center justify-end">
        <Button variant="outline" onClick={addEntry}>
          <Plus className="h-4 w-4 mr-2" />
          Add Key
        </Button>

        <Button onClick={handleExecute} disabled={mutation.isPending || !isValid}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Get {entries.length} Item{entries.length !== 1 ? 's' : ''}
        </Button>
      </div>

      {!!mutation.data && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Result</h4>
          <ListResultView
            data={result}
            error={error ?? undefined}
            entityType={target === 'entity' ? name : undefined}
          />
        </div>
      )}
    </div>
  );
}
