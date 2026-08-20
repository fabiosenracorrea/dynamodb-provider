import type { CallDescriptor } from './operation';

function format(value: unknown): string {
  if (value === undefined) return '';

  const json = JSON.stringify(value, null, 2);

  if (!json || json === '{}') return '';

  // Drop the quotes around simple identifier keys so it reads as source, not JSON.
  return json.replace(/^(\s*)"([A-Za-z_$][\w$]*)":/gm, '$1$2:');
}

/**
 * Builds the `await ...` snippet for a resolved library call, from the same path the
 * executor took — so it cannot drift from what actually ran.
 */
export function describeCall(path: string, args: unknown[] = []): CallDescriptor {
  const rendered = args.map(format).filter(Boolean).join(', ');

  return {
    code: `await ${path}(${rendered})`,
    params: args.length === 1 ? args[0] : args,
  };
}

/** `table.schema.from(TASK).queryIndex.ByStatus.byDueDate` and friends. */
export function entityCallPath(
  entityType: string,
  method: string,
  { index, rangeQuery }: { index?: string; rangeQuery?: string } = {},
): string {
  const base = `table.schema.from(${entityType})`;

  if (method !== 'query') return `${base}.${method}`;

  const queryRoot = index ? `${base}.queryIndex.${index}` : `${base}.query`;

  return `${queryRoot}.${rangeQuery ?? 'custom'}`;
}
