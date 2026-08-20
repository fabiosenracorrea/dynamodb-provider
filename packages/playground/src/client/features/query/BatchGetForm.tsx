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
    const vars: Array<{ name: string; source: 'partition' | 'range'; numeric: boolean }> = [];
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
        entry.id === entryId ? { ...entry, values: { ...entry.values, [varName]: value } } : entry,
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
    entries.every((entry) => variables.every((v) => !!entry.values[v.name]?.trim()));

  const result = mutation.data?.success ? mutation.data.data : null;
  const error = mutation.data?.success === false ? mutation.data.error : null;

  return (
    <div className="space-y-4">
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      {variables.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">
          No parameters required - key uses only constant values
        </p>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3"
            >
              <div className="grid flex-1 gap-2">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">Key {index + 1}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {variables.map((variable) => (
                    <div key={variable.name}>
                      <label className="mb-1 flex items-center gap-1.5 text-xs font-medium">
                        <span>{variable.name}</span>
                        <span className="font-normal text-muted-foreground">
                          ({variable.source}
                          {variable.numeric ? ', n' : ''})
                        </span>
                      </label>
                      <Input
                        type={variable.numeric ? 'number' : 'text'}
                        value={entry.values[variable.name]}
                        onChange={(e) => handleChange(entry.id, variable.name, e.target.value)}
                        placeholder={variable.name}
                        className="h-8 font-mono text-sm"
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

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={addEntry}>
          <Plus className="mr-2 h-4 w-4" />
          Add Key
        </Button>

        <Button onClick={handleExecute} disabled={mutation.isPending || !isValid}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Get {entries.length} Item{entries.length !== 1 ? 's' : ''}
        </Button>
      </div>

      {!!mutation.data && (
        <div className="border-t pt-4">
          <h4 className="mb-2 text-sm font-medium">Result</h4>
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
