// Types for the playground
import type {
  AnyEntity,
  AnyCollection,
  SingleTable,
  SingleTableConfig,
  DynamodbProvider,
} from 'dynamodb-provider';

export type { AnyEntity, AnyCollection };

export interface PlaygroundConfig {
  table: SingleTable<
    SingleTableConfig & {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dynamodbProvider: DynamodbProvider<any>;
    }
  >;

  entities: AnyEntity[];
  collections?: AnyCollection[];
  port?: number;
}

export interface IndexInstance {
  index: string;
  getPartitionKey: (...args: unknown[]) => unknown;
  getRangeKey: (...args: unknown[]) => unknown;
  rangeQueries?: Record<string, (...args: unknown[]) => unknown>;
}

export type TableMetadata = SingleTableConfig;

interface KeyPice {
  type: 'CONSTANT' | 'VARIABLE';
  numeric?: boolean;

  /**
   * Constant value or variable name
   *
   * Eg:
   *
   * () => ['USERS'] = 'USERS'
   * ({ id }) => [id] = 'id'
   */
  value: string;
}

interface RangeQuery {
  name: string;
  operation: string;
  params: string[]; // named params from `getValues` if empty = no param necessary
}

export interface EntityMetadata {
  name: string;
  type: string;

  partitionKey: KeyPice[];
  rangeKey: KeyPice[];
  rangeQueries: RangeQuery[];

  indexes: Array<{
    name: string;
    index: string;
    partitionKey: KeyPice[];
    rangeKey: KeyPice[];
    rangeQueries: RangeQuery[];
  }>;
}

export interface CollectionMetadata {
  name: string;
  type: 'SINGLE' | 'MULTIPLE';
  partitionKey: KeyPice[];
  originEntityType: string | null;
  joins: string[];
}

export interface ExecuteRequest {
  target: 'entity' | 'collection' | 'table';
  name: string;
  operation: string;
  index?: string;
  params: Record<string, unknown>;
}

export interface ExecuteResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface MetadataResponse {
  table: TableMetadata;
  entities: AnyEntity[];
  collections: AnyCollection[];
}
