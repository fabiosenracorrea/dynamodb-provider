import { SingleTable } from './implementation';

/**
 * Extracts the SingleTable configuration type
 *
 * @example
 * ```ts
 * const table = new SingleTable({...config})
 *
 * type TableConfig = ExtractTableConfig<typeof table>
 * ```
 */
export type ExtractTableConfig<T> = T extends SingleTable<infer X> ? X : never;
