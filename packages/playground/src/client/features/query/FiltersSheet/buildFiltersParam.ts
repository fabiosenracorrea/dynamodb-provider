import type { FilterRow } from './types';
import { getOpConfig, parseValue } from './constants';

// Helper to convert FilterRow[] to the API format
export function buildFiltersParam(filters: FilterRow[]): Record<string, unknown> | undefined {
  const validFilters = filters.filter((f) => {
    if (!f.property) return false;
    const config = getOpConfig(f.operation);
    if (!config) return false;
    if (config.params.includes('value') && !f.value) return false;
    if (config.params.includes('start') && !f.start) return false;
    if (config.params.includes('end') && !f.end) return false;
    if (config.params.includes('values') && !f.values) return false;
    return true;
  });

  if (validFilters.length === 0) return undefined;

  const result: Record<string, unknown> = {};

  for (const filter of validFilters) {
    const config = getOpConfig(filter.operation);
    if (!config) continue;

    let filterValue: unknown;

    // Build the condition object
    if (config.params.length === 0) {
      // exists / not_exists
      filterValue = { operation: filter.operation };
    } else if (config.params.includes('value')) {
      filterValue = {
        operation: filter.operation,
        value: parseValue(filter.value),
      };
    } else if (config.params.includes('start')) {
      filterValue = {
        operation: filter.operation,
        start: parseValue(filter.start),
        end: parseValue(filter.end),
      };
    } else if (config.params.includes('values')) {
      filterValue = {
        operation: filter.operation,
        values: filter.values.split(',').map((v) => parseValue(v.trim())),
      };
    }

    result[filter.property] = filterValue;
  }

  return Object.keys(result).length > 0 ? result : undefined;
}
