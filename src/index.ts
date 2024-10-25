export {
  DynamodbProvider,
  type CreateItemParams,
  type DeleteItemParams,
  type ListOptions,
  type QueryParams,
  type QueryResult,
  type TransactionConfig,
  type UpdateParams,
} from './provider';

export {
  SingleTable,
  type GetCollectionType,
  type SingleTableConfig,
  type FromCollection,
  type FromEntity,
  type GetCollectionParams,
  type GetCollectionResult,
  type ExtractTableConfig,
  type ExtendableCollection,
  type ExtendableSingleTableEntity,
} from './singleTable';
