export {
  DynamodbProvider,
  type CreateParams,
  type DeleteParams,
  type UpdateParams,
  type ListOptions,
  type QueryParams,
  type QueryConfigParams,
  type QueryResult,
  type TransactionParams,
  type DBSet,
} from './provider';

export {
  SingleTable,
  type SingleTableConfig,
  type SingleTableTransactionParams,
  type FromCollection,
  type FromEntity,
  type GetCollectionType,
  type GetCollectionParams,
  type GetCollectionResult,
  type ExtractTableConfig,
  type AnyEntity,
  type AnyCollection,
} from './singleTable';
