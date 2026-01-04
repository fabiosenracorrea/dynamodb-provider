import { ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { FiltersSheet } from '../FiltersSheet';
import { QueryConfig, QueryConfigHandlers } from './queryConfig.hook';
import { RangeFilter, RangeFilterProps } from './RangeFilter';

interface QueryParamsProps extends Pick<RangeFilterProps, 'customQueries' | 'rangeKey'> {
  params: QueryConfig;
  configHandlers: QueryConfigHandlers;
}

export function QueryParams({
  configHandlers,
  params,
  ...rangeConfig
}: QueryParamsProps) {
  const { filters, retrieveOrder, limit, range } = params;

  return (
    <>
      <RangeFilter
        {...rangeConfig}
        range={range}
        setRange={configHandlers.getSetter('range')}
      />

      <section className="space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Filters */}
          <FiltersSheet
            filters={filters}
            onChange={configHandlers.getSetter('filters')}
          />

          <div className="min-w-[100px] flex-1">
            <label className="text-sm font-medium mb-1.5 block">Limit</label>
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
            <label className="text-sm font-medium mb-1.5 block">Order</label>
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
                <ArrowUp className="h-4 w-4 ml-2" />
              ) : (
                <ArrowDown className="h-4 w-4 ml-2" />
              )}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
