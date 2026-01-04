import { useState } from 'react';
import { Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListResultView } from './ListResultView';
import { buildFiltersParam } from './FiltersSheet';
import { useExecute } from '@/utils/hooks';
import type { ExecuteRequest } from '@/utils/api';

import {
  buildRangeParams,
  isRangeQueryValid,
  QueryParams,
  useQueryConfig,
} from './QueryParams';
import { omit } from '@/utils/object';

interface ListFormProps {
  target: ExecuteRequest['target'];
  name: string;
}

export function ListForm({ target, name }: ListFormProps) {
  const [queryConfig, configHandlers] = useQueryConfig();

  const [fullRetrieval, setFullRetrieval] = useState(false);

  const mutation = useExecute();

  const handleExecute = () => {
    const params = {
      ...omit(queryConfig, ['range']),
      limit: queryConfig.fullRetrieval ? undefined : Number(queryConfig.limit) || 25,
      filters: buildFiltersParam(queryConfig.filters),
      ...buildRangeParams(queryConfig.range),
    };

    mutation.mutate({
      target,
      name,
      operation: 'list',
      params,
    });
  };

  const isCustomRangeValid = isRangeQueryValid(queryConfig.range);

  const isValid = isCustomRangeValid;

  const result = mutation.data?.success ? mutation.data.data : null;
  const error = mutation.data?.success === false ? mutation.data.error : null;

  return (
    <div className="space-y-6">
      {/* Info Alert */}
      <div className="flex items-start gap-3 p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-sm dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          This operation requires a{' '}
          <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">
            typeIndex
          </code>{' '}
          GSI configured on the table, and entities must have their type columns properly
          set.
        </p>
      </div>

      <QueryParams params={queryConfig} configHandlers={configHandlers} />

      <div className="flex items-center gap-4 justify-end">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="fullRetrieval"
            checked={fullRetrieval}
            onChange={(e) => setFullRetrieval(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <label htmlFor="fullRetrieval" className="text-sm">
            Full retrieval
          </label>
        </div>

        <Button onClick={handleExecute} disabled={mutation.isPending || !isValid}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          List
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
