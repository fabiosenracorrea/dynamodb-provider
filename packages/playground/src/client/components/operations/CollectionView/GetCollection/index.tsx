import { useState, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useCollection } from '@/context';
import { useExecute } from '@/utils/hooks';

import { CollectionListView } from './CollectionListView';
import { CollectionLoading } from '../LoadingCollection';
import { SingleCollectionView } from './SingleCollectionView';

interface CollectionOperationsProps {
  collectionName: string;
}

export function GetCollection({ collectionName }: CollectionOperationsProps) {
  const collection = useCollection(collectionName);

  // Form state
  const [values, setValues] = useState<Record<string, string>>({});
  const mutation = useExecute();

  // Extract partition key variables
  const variables = useMemo(() => {
    if (!collection) return [];
    const vars: Array<{ name: string; numeric: boolean }> = [];
    const seen = new Set<string>();

    collection.partitionKey.forEach((piece) => {
      if (piece.type === 'VARIABLE' && !seen.has(piece.value)) {
        seen.add(piece.value);
        vars.push({
          name: piece.value,
          numeric: piece.numeric ?? false,
        });
      }
    });

    return vars;
  }, [collection]);

  if (!collection) {
    return <CollectionLoading />;
  }

  const handleChange = (varName: string, value: string) => {
    setValues((prev) => ({ ...prev, [varName]: value }));
  };

  const handleExecute = () => {
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
      target: 'collection',
      name: collection.name,
      operation: 'get',
      params,
    });
  };

  const isValid = variables.every((v) => values[v.name]?.trim() !== '');
  const result = mutation.data?.success ? mutation.data.data : null;
  const error = mutation.data?.success === false ? mutation.data.error : null;

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base">Get Collection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {variables.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No parameters required - partition key uses only constant values
          </p>
        ) : (
          <div className="grid gap-3">
            {variables.map((variable) => (
              <div key={variable.name}>
                <label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                  <span>{variable.name}</span>
                  {variable.numeric && (
                    <span className="text-xs text-muted-foreground font-normal">
                      (numeric)
                    </span>
                  )}
                </label>
                <Input
                  type={variable.numeric ? 'number' : 'text'}
                  value={values[variable.name] ?? ''}
                  onChange={(e) => handleChange(variable.name, e.target.value)}
                  placeholder={`Enter ${variable.name}...`}
                  className="font-mono"
                />
              </div>
            ))}
          </div>
        )}

        <Button onClick={handleExecute} disabled={mutation.isPending || !isValid}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Get Collection
        </Button>

        {(result !== null || error) && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Result</h4>

            {Array.isArray(result) ? (
              <CollectionListView data={result} error={error ?? undefined} />
            ) : (
              <SingleCollectionView data={result} error={error ?? undefined} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
