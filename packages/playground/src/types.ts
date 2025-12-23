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

export interface KeyPiece {
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

export interface RangeQuery {
  name: string;
  operation: string;
  params: string[]; // named params from `getValues` if empty = no param necessary
}

export interface EntityMetadata {
  name: string;
  type: string;
  index: number;

  partitionKey: KeyPiece[];
  rangeKey: KeyPiece[];
  rangeQueries: RangeQuery[];

  indexes: Array<{
    name: string;
    index: string;
    partitionKey: KeyPiece[];
    rangeKey: KeyPiece[];
    rangeQueries: RangeQuery[];
  }>;
}

export interface CollectionMetadata {
  index: number;
  name: string;
  type: 'SINGLE' | 'MULTIPLE';
  partitionKey: KeyPiece[];
  originEntityType: string | null;
  joins: string[];
}

export interface PartitionGroup {
  id: string;
  pattern: string;
  source: string; // 'TABLE' or index name
  sourceType: 'main' | 'index';
  entities: string[]; // entity types that share this partition
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
  entities: EntityMetadata[];
  collections: CollectionMetadata[];
}
