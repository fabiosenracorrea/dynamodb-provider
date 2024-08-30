import { SingleTableProvider } from './implementation';

export * from './definition';

export { SingleTableTransactionConfig } from './definitions';

export { singleTableSchema, TypeFromCollection } from './model';
export { cleanInternalProps, cleanInternalPropsFromList, KeyValue } from './config';

export type EntityOmit<Entity, Keys extends keyof Entity> = Omit<Entity, Keys | '_type'>;

export default SingleTableProvider;
