import { Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListResultView } from './ListResultView';
import { buildFiltersParam } from './FiltersSheet';
import { useExecute } from '@/utils/hooks';
import type { ExecuteRequest } from '@/utils/api';

import {
  buildRangeParams,
  FullRetrievalCheckbox,
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

  const mutation = useExecute();

  const handleExecute = () => {
    const params = {
      ...omit(queryConfig, ['range', 'limit', 'filters']),
      limit: queryConfig.fullRetrieval ? undefined : Number(queryConfig.limit) || 25,
      filters: buildFiltersParam(queryConfig.filters),
      ...buildRangeParams(queryConfig.range).params,
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
      <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <p>
          This operation requires a{' '}
          <code className="rounded bg-blue-100 px-1 font-mono dark:bg-blue-900">typeIndex</code> GSI
          configured on the table, and entities must have their type columns properly set.
        </p>
      </div>

      <QueryParams params={queryConfig} configHandlers={configHandlers} />

      <div className="flex items-center justify-end gap-4">
        <FullRetrievalCheckbox
          selected={queryConfig.fullRetrieval}
          onChange={configHandlers.getSetter('fullRetrieval')}
        />

        <Button onClick={handleExecute} disabled={mutation.isPending || !isValid}>
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          List
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
