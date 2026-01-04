import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useExecute } from '@/utils/hooks';
import type { ExecuteRequest, KeyPiece } from '@/utils/api';
import { cn } from '@/utils/utils';

import { GetResultView } from './GetResultView';
import { wrapFormAction } from '@/utils/html';

interface KeyParamsFormProps {
  target: ExecuteRequest['target'];
  name: string;
  operation: string;
  index?: string;
  description?: string;
  buttonLabel?: string;
  partitionKey: KeyPiece[];
  rangeKey: KeyPiece[];
}

export function KeyParamsForm({
  target,
  name,
  operation,
  index,
  description,
  buttonLabel = 'Execute',
  partitionKey,
  rangeKey,
}: KeyParamsFormProps) {
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

  // Initialize form values
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(variables.map((v) => [v.name, ''])),
  );

  const mutation = useExecute();

  const handleChange = (varName: string, value: string) => {
    setValues((prev) => ({ ...prev, [varName]: value }));
  };

  const handleExecute = () => {
    // Convert numeric values
    const params: Record<string, unknown> = {};
    variables.forEach((v) => {
      const val = values[v.name];
      if (v.numeric && val) {
        params[v.name] = Number(val);
      } else {
        params[v.name] = val;
      }
    });

    mutation.mutate({
      target,
      name,
      operation,
      index,
      params,
    });
  };

  const isValid = variables.every((v) => values[v.name]?.trim() !== '');
  const result = mutation.data?.success ? mutation.data.data : null;
  const error = mutation.data?.success === false ? mutation.data.error : null;

  return (
    <form
      onSubmit={wrapFormAction(handleExecute)}
      className="space-y-4 p-3 border rounded-lg bg-muted/30"
    >
      {description && <p className="text-sm text-muted-foreground">{description}</p>}

      {variables.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No parameters required - key uses only constant values
        </p>
      ) : (
        <div
          className={cn(
            'grid gap-3',
            variables.length >= 2 ? 'grid-cols-2' : 'grid-cols-1',
          )}
        >
          {variables.map((variable) => (
            <div key={variable.name}>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                <span>{variable.name}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  ({variable.source} key{variable.numeric ? ', numeric' : ''})
                </span>
              </label>
              <Input
                type={variable.numeric ? 'number' : 'text'}
                value={values[variable.name]}
                onChange={(e) => handleChange(variable.name, e.target.value)}
                placeholder={`Enter ${variable.name}...`}
                className="font-mono"
              />
            </div>
          ))}
        </div>
      )}

      <Button className="ml-auto block" disabled={mutation.isPending || !isValid}>
        {mutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          buttonLabel
        )}
      </Button>

      {(result !== null || error) && (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Result</h4>
          <GetResultView
            data={result}
            error={error ?? undefined}
            entityType={target === 'entity' ? name : undefined}
          />
        </div>
      )}
    </form>
  );
}
