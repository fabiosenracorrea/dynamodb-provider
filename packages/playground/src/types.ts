/* eslint-disable @typescript-eslint/no-explicit-any */
// Types for the playground
import type {
  AnyEntity,
  AnyCollection,
  DynamodbProvider,
  SingleTable,
  SingleTableConfig,
} from 'dynamodb-provider';

export type { AnyEntity, AnyCollection };

/**
 * `IDynamodbProvider` is not re-exported from the package root, so the concrete
 * class stands in for the interface here.
 */
export type PlaygroundProvider = DynamodbProvider<any>;

export interface PlaygroundConfig {
  table: SingleTable<any>;

  /**
   * The same provider instance passed to `new SingleTable({ dynamodbProvider })`.
   *
   * SingleTable drops it from its public `config`, so it cannot be read back off
   * the table — it powers the table browser's scan/key lookup and the connection probe.
   */
  dynamodbProvider: PlaygroundProvider;

  entities: AnyEntity[] | Record<string, AnyEntity>;
  collections?: Record<string, AnyCollection>;
  port?: number;
  autoOpen?: boolean;

  /**
   * Editing and deleting act on an item that already exists, so its shape is known.
   * There is no `create` flag: entities are types with no runtime shape, so a create
   * form would have to guess an item's attributes. The `entity.create` operation
   * still exists server-side but is unreachable without a flag to enable it.
   */
  enableMutations?: {
    update?: boolean;
    delete?: boolean;
  };
}

/**
 * `PlaygroundConfig` with the user-facing conveniences resolved: `entities` always
 * an array, `collections` always present. Everything past config loading uses this.
 */
export interface ResolvedPlaygroundConfig extends Omit<PlaygroundConfig, 'entities'> {
  entities: AnyEntity[];
  collections: Record<string, AnyCollection>;
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
  isUpdateEnabled: boolean;
  isDeleteEnabled: boolean;
}
