import { DynamodbProvider } from './implementation';

export { IDynamodbProvider as IDatabaseProvider } from './definition';

export {
  TransactionConfig,
  DBSet,
  QueryParams,
  QueryResult,
  UpdateParams,
  CreateItemParams,
  DeleteItemParams,
  ListOptions,
} from './utils';

export default DynamodbProvider;
