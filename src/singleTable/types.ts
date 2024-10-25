import { SingleTable } from './implementation';

export type ExtractTableConfig<T> = T extends SingleTable<infer X> ? X : never;
