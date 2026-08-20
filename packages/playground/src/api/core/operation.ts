/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ZodType } from 'zod';

import type {
  AnyCollection,
  AnyEntity,
  MetadataResponse,
  ResolvedPlaygroundConfig,
} from '../../types';

export type OperationTarget = 'entity' | 'collection' | 'table';

/** Which `enableMutations` flag must be on for an operation to run. */
export type MutationKind = 'create' | 'update' | 'delete';

export interface OperationContext {
  config: ResolvedPlaygroundConfig;
  table: ResolvedPlaygroundConfig['table'];
  provider: ResolvedPlaygroundConfig['dynamodbProvider'];
  metadata: MetadataResponse;
  entitiesByType: Map<string, AnyEntity>;
  collectionsByName: Map<string, AnyCollection>;
}

/**
 * The library call an operation resolved to, echoed back so the UI can show the
 * equivalent code instead of guessing at it.
 */
export interface CallDescriptor {
  code: string;
  params: unknown;
}

export interface OperationResult {
  data: unknown;
  paginationToken?: string;
  call: CallDescriptor;
}

export interface OperationInput<Params> {
  ctx: OperationContext;
  params: Params;
  /** Entity index NAME (the key in the entity's `indexes`), not the physical GSI. */
  index?: string;
  /** A named `rangeQuery` on the resolved entity or index. */
  rangeQuery?: string;
}

export interface EntityOperationInput<Params> extends OperationInput<Params> {
  entity: AnyEntity;
  /** `schema.from(entity)` — the repository for the resolved entity. */
  repo: any;
}

export interface CollectionOperationInput<Params> extends OperationInput<Params> {
  collection: AnyCollection;
  collectionName: string;
  repo: any;
}

interface BaseDefinition<Params> {
  operation: string;
  params: ZodType<Params>;
  mutation?: MutationKind;
}

export interface EntityOperation<Params = any> extends BaseDefinition<Params> {
  target: 'entity';
  run: (input: EntityOperationInput<Params>) => Promise<OperationResult>;
}

export interface CollectionOperation<Params = any> extends BaseDefinition<Params> {
  target: 'collection';
  run: (input: CollectionOperationInput<Params>) => Promise<OperationResult>;
}

export interface TableOperation<Params = any> extends BaseDefinition<Params> {
  target: 'table';
  run: (input: OperationInput<Params>) => Promise<OperationResult>;
}

export type Operation = EntityOperation | CollectionOperation | TableOperation;

export function defineEntityOperation<Params>(
  definition: Omit<EntityOperation<Params>, 'target'>,
): EntityOperation<Params> {
  return { ...definition, target: 'entity' };
}

export function defineCollectionOperation<Params>(
  definition: Omit<CollectionOperation<Params>, 'target'>,
): CollectionOperation<Params> {
  return { ...definition, target: 'collection' };
}

export function defineTableOperation<Params>(
  definition: Omit<TableOperation<Params>, 'target'>,
): TableOperation<Params> {
  return { ...definition, target: 'table' };
}

export function buildOperationContext(
  config: ResolvedPlaygroundConfig,
  metadata: MetadataResponse,
): OperationContext {
  return {
    config,
    metadata,
    table: config.table,
    provider: config.dynamodbProvider,
    entitiesByType: new Map(config.entities.map((entity) => [entity.type, entity])),
    collectionsByName: new Map(Object.entries(config.collections)),
  };
}
