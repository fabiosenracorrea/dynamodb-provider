import { ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { FiltersSheet } from '../FiltersSheet';
import { QueryConfig, QueryConfigHandlers } from './queryConfig.hook';
import { RangeFilter, RangeFilterProps } from './RangeFilter';

interface QueryParamsProps extends Pick<RangeFilterProps, 'customQueries' | 'rangeKey'> {
  params: QueryConfig;
  configHandlers: QueryConfigHandlers;
  filter?: boolean;
}

export function QueryParams({
  configHandlers,
  params,
  filter = true,
  ...rangeConfig
}: QueryParamsProps) {
  const { filters, retrieveOrder, limit, range } = params;

  return (
    <>
      <RangeFilter {...rangeConfig} range={range} setRange={configHandlers.getSetter('range')} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          {/* Filters */}
          {filter && (
            <FiltersSheet filters={filters} onChange={configHandlers.getSetter('filters')} />
          )}

          <div className="min-w-[100px] flex-1">
            <label className="mb-1.5 block text-sm font-medium">Limit</label>
            <Input
              type="number"
              value={limit}
              onChange={(e) => configHandlers.set('limit', e.target.value)}
              placeholder="25"
              min={1}
              max={1000}
            />
          </div>

          <div className="min-w-[140px] flex-1">
            <FieldCaption>Order</FieldCaption>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              onClick={() =>
                configHandlers.dispatch({
                  retrieveOrder: retrieveOrder === 'ASC' ? 'DESC' : 'ASC',
                })
              }
            >
              <span>{retrieveOrder === 'ASC' ? 'Ascending' : 'Descending'}</span>

              {retrieveOrder === 'ASC' ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : (
                <ArrowDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
