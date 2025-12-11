import type { AnyEntity } from 'singleTable/model';
import type { SingleTableConfig } from 'singleTable/adaptor/definitions';
import type {
  CreateEntityParams,
  DeleteEntityParams,
  EntityBatchGetParams,
  EntityGetParams,
  UpdateEntityParams,
  UpdateReturn,
} from './crud';
import type { ListEntityParams, ListEntityResult } from './list';
import type { EntityQueries } from './query';

export type ListEntityMethods<
  Registered extends AnyEntity,
  SingleConfig extends SingleTableConfig,
> = undefined extends SingleConfig['typeIndex']
  ? object
  : {
      listAll(): Promise<Array<Registered['__entity']>>;

      list(params?: ListEntityParams): Promise<ListEntityResult<Registered['__entity']>>;
    };

/**
 * Available methods unlocked by an entity
 *
 * ```ts
 * const methods = schema.from(ENTITY)
 * ```
 */
export type FromEntity<
  Registered extends AnyEntity,
  SingleConfig extends SingleTableConfig,
> = {
  get(
    ...params: EntityGetParams<Registered>
  ): Promise<Registered['__entity'] | undefined>;

  batchGet(
    params: EntityBatchGetParams<Registered>,
  ): Promise<Array<Registered['__entity']>>;

  create(...params: CreateEntityParams<Registered>): Promise<Registered['__entity']>;

  delete(...params: DeleteEntityParams<Registered>): Promise<void>;

  update<Params extends UpdateEntityParams<Registered>>(
    params: Params,
  ): Promise<UpdateReturn<Registered, Params>>;
} & EntityQueries<Registered> &
  ListEntityMethods<Registered, SingleConfig>;

export interface FromEntityMethods<SingleConfig extends SingleTableConfig> {
  fromEntity<Registered extends AnyEntity>(
    entity: Registered,
  ): FromEntity<Registered, SingleConfig>;
}
